from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from ..database import get_db
from ..middleware import get_current_user, require_role
from ..models.user import User
from ..models.contact import Contact
from ..models.inventory import InventoryItem

router = APIRouter(prefix="/admin", tags=["admin"])

SIMILARITY_THRESHOLD = 0.3


def _run_similarity(db, table, column_a, column_b, threshold, extra_filter=""):
    sql = text(f"""
        SELECT a.id AS id_a, b.id AS id_b,
               a.{column_a} AS val_a, b.{column_b} AS val_b,
               similarity(a.{column_a}, b.{column_b}) AS sim
        FROM {table} a
        JOIN {table} b ON a.id < b.id
        WHERE similarity(a.{column_a}, b.{column_b}) > :th
        {extra_filter}
        ORDER BY sim DESC
    """)
    return db.execute(sql, {"th": threshold}).fetchall()


@router.get("/detect-duplicates")
def detect_duplicates(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    contacts_name = _run_similarity(db, "contacts", "name", "name", SIMILARITY_THRESHOLD)
    contacts_email = _run_similarity(db, "contacts", "email", "email", SIMILARITY_THRESHOLD, "AND a.email != '' AND b.email != ''")
    contacts_phone = _run_similarity(db, "contacts", "phone", "phone", SIMILARITY_THRESHOLD, "AND a.phone != '' AND b.phone != ''")
    contacts_rnc = _run_similarity(db, "contacts", "rnc", "rnc", SIMILARITY_THRESHOLD, "AND a.rnc != '' AND b.rnc != ''")

    inventory_name = _run_similarity(db, "inventory", "name", "name", SIMILARITY_THRESHOLD)
    inventory_sku = _run_similarity(db, "inventory", "sku", "sku", SIMILARITY_THRESHOLD, "AND a.sku != '' AND b.sku != ''")

    users_name = _run_similarity(db, "users", "name", "name", SIMILARITY_THRESHOLD)
    users_email = _run_similarity(db, "users", "email", "email", SIMILARITY_THRESHOLD, "AND a.email != '' AND b.email != ''")

    def _build(pairs, entity, field):
        seen = set()
        out = []
        for r in pairs:
            key = (r.id_a, r.id_b)
            if key in seen or (r.id_b, r.id_a) in seen:
                continue
            seen.add(key)
            out.append({
                "entity": entity, "field": field,
                "id_a": r.id_a, "id_b": r.id_b,
                "val_a": r.val_a, "val_b": r.val_b,
                "similarity": round(r.sim, 3),
            })
        return out

    duplicates = []
    duplicates.extend(_build(contacts_name, "contacts", "name"))
    duplicates.extend(_build(contacts_email, "contacts", "email"))
    duplicates.extend(_build(contacts_phone, "contacts", "phone"))
    duplicates.extend(_build(contacts_rnc, "contacts", "rnc"))
    duplicates.extend(_build(inventory_name, "inventory", "name"))
    duplicates.extend(_build(inventory_sku, "inventory", "sku"))
    duplicates.extend(_build(users_name, "users", "name"))
    duplicates.extend(_build(users_email, "users", "email"))

    return {"duplicates": duplicates, "total": len(duplicates)}


@router.post("/detect-duplicates/resolve")
def resolve_duplicates(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    action = data.get("action")
    entity = data.get("entity")
    primary_id = data.get("primary_id")
    duplicate_id = data.get("duplicate_id")

    if not all([action, entity, primary_id, duplicate_id]):
        raise HTTPException(400, "action, entity, primary_id, duplicate_id requeridos")
    if action not in ("merge", "delete"):
        raise HTTPException(400, "action debe ser 'merge' o 'delete'")

    model_map = {"contacts": Contact, "inventory": InventoryItem, "users": User}
    ModelClass = model_map.get(entity)
    if not ModelClass:
        raise HTTPException(400, f"Entidad no soportada: {entity}")

    primary = db.query(ModelClass).filter(ModelClass.id == primary_id).first()
    duplicate = db.query(ModelClass).filter(ModelClass.id == duplicate_id).first()
    if not primary or not duplicate:
        raise HTTPException(404, "Registro primario o duplicado no encontrado")

    if action == "merge":
        for col in ModelClass.__table__.columns:
            name = col.name
            if name in ("id", "created_at", "tenant_id"):
                continue
            primary_val = getattr(primary, name)
            dup_val = getattr(duplicate, name)
            if not primary_val or (isinstance(primary_val, str) and not primary_val.strip()):
                if dup_val:
                    setattr(primary, name, dup_val)
        db.flush()

    if hasattr(duplicate, "active"):
        duplicate.active = False
    else:
        db.delete(duplicate)
    db.commit()

    return {"message": f"Duplicado {'fusionado' if action == 'merge' else 'eliminado'}", "primary_id": primary_id}
