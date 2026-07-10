from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from ..database import get_db
from ..middleware import get_current_user
from ..models.user import User
from ..models.inventory import InventoryItem
from ..models.inventory_count import InventoryCount
from ..models.pocket_notification import PocketNotification
from ..models.activity_log import ActivityLog
from ..services.websocket_manager import manager
from ..services import stock_service

router = APIRouter(prefix="/pocket", tags=["pocket"])


# ── WebSocket para notificaciones en vivo ──
@router.websocket("/ws/{tenant_id}/{user_id}")
async def pocket_websocket(websocket: WebSocket, tenant_id: str, user_id: str):
    await manager.connect(websocket, tenant_id, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id, user_id)


# ── Dashboard del Pocket ──
@router.get("/dashboard")
def pocket_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id or "default"
    tasks_count = db.query(InventoryCount).filter(
        InventoryCount.tenant_id == tenant_id,
        InventoryCount.user_id == current_user.id,
        InventoryCount.status == "pending",
    ).count()
    unread_notifs = db.query(PocketNotification).filter(
        PocketNotification.tenant_id == tenant_id,
        PocketNotification.user_id == current_user.id,
        PocketNotification.read == False,
    ).count()
    low_stock = db.query(InventoryItem).filter(
        InventoryItem.tenant_id == tenant_id,
        InventoryItem.active == True,
        InventoryItem.stock <= InventoryItem.min_stock,
    ).count()
    return {
        "tasks_count": tasks_count,
        "unread_notifications": unread_notifs,
        "low_stock_alerts": low_stock,
        "user_name": current_user.name,
    }


# ── Notificaciones ──
@router.get("/notifications")
def list_notifications(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(PocketNotification).filter(
        PocketNotification.tenant_id == (current_user.tenant_id or "default"),
        PocketNotification.user_id == current_user.id,
    ).order_by(PocketNotification.created_at.desc()).limit(limit).all()


@router.post("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = db.query(PocketNotification).filter(
        PocketNotification.id == notif_id,
        PocketNotification.user_id == current_user.id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    n.read = True
    db.commit()
    return {"message": "Marcada como leída"}


@router.post("/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(PocketNotification).filter(
        PocketNotification.tenant_id == (current_user.tenant_id or "default"),
        PocketNotification.user_id == current_user.id,
        PocketNotification.read == False,
    ).update({"read": True})
    db.commit()
    return {"message": "Todas marcadas como leídas"}


# ── Iniciar sesión de conteo ──
@router.post("/inventory-count/start")
def start_count_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import uuid
    session_id = f"COUNT-{uuid.uuid4().hex[:8].upper()}"
    return {"session_id": session_id, "user_name": current_user.name}


# ── Escanear producto (suma +1 al conteo) ──
@router.post("/inventory-count/scan")
def scan_product(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def _val(v):
        if isinstance(v, list): return str(v[0]).strip() if v else ""
        return str(v).strip() if v else ""

    tenant_id = current_user.tenant_id or "default"
    session_id = _val(data.get("session_id"))
    sku = _val(data.get("sku"))
    warehouse = _val(data.get("warehouse"))
    shelf = _val(data.get("shelf"))
    row = _val(data.get("row"))
    box = _val(data.get("box"))

    if not session_id or not sku:
        raise HTTPException(status_code=400, detail="session_id y sku requeridos")

    product = db.query(InventoryItem).filter(
        InventoryItem.tenant_id == tenant_id,
        InventoryItem.sku == sku,
        InventoryItem.active == True,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Producto con SKU {sku} no encontrado")

    existing = db.query(InventoryCount).filter(
        InventoryCount.tenant_id == tenant_id,
        InventoryCount.session_id == session_id,
        InventoryCount.product_id == product.id,
    ).first()

    if existing:
        existing.scanned_count += 1
        existing.shelf = shelf or existing.shelf
        existing.row = row or existing.row
        existing.box = box or existing.box
    else:
        existing = InventoryCount(
            tenant_id=tenant_id,
            user_id=current_user.id,
            user_name=current_user.name,
            product_id=product.id,
            product_name=product.name,
            sku=product.sku,
            warehouse=warehouse,
            shelf=shelf,
            row=row,
            box=box,
            scanned_count=1,
            session_id=session_id,
        )
        db.add(existing)

    db.commit()
    db.refresh(existing)
    return {
        "product_name": product.name,
        "scanned_count": existing.scanned_count,
        "shelf": shelf or product.shelf,
        "row": row or product.row,
        "box": box or product.box,
        "stock": product.stock,
    }


# ── Finalizar sesión de conteo ──
@router.post("/inventory-count/finish")
def finish_count_session(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id or "default"
    session_id = data.get("session_id")
    action = data.get("action", "confirm")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requerido")

    counts = db.query(InventoryCount).filter(
        InventoryCount.tenant_id == tenant_id,
        InventoryCount.session_id == session_id,
    ).all()

    if not counts:
        raise HTTPException(status_code=404, detail="Sesión de conteo no encontrada")

    if action == "confirm":
        for c in counts:
            product = db.query(InventoryItem).filter(
                InventoryItem.id == c.product_id
            ).first()
            if product and c.scanned_count != product.stock:
                delta = c.scanned_count - product.stock
                stock_service.adjust_stock(
                    db, product.id, delta,
                    f"Conteo físico: {c.scanned_count} unidades en {c.shelf or '?'}-{c.row or '?'}-{c.box or '?'}",
                    current_user.id,
                )
            c.status = "completed"
            c.completed_at = datetime.now(timezone.utc)

        log = ActivityLog(
            tenant_id=tenant_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="inventory_count_finish",
            detail=f"Conteo finalizado: {len(counts)} productos en sesión {session_id}",
            store="inventory_counts",
        )
        db.add(log)

    db.commit()
    return {"message": "Conteo finalizado", "counted_products": len(counts)}


# ── Historial de conteos ──
@router.get("/inventory-count/history")
def count_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(InventoryCount).filter(
        InventoryCount.tenant_id == (current_user.tenant_id or "default"),
        InventoryCount.user_id == current_user.id,
    ).order_by(InventoryCount.created_at.desc()).limit(50).all()
