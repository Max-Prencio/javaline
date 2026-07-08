from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models.inventory import InventoryItem
from ..models.stock_movement import StockMovement


def adjust_stock(
    db: Session,
    product_id: str,
    quantity: int,
    reason: str,
    user_id: str = "system",
) -> dict:
    item = db.query(InventoryItem).filter(InventoryItem.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    before = item.stock
    new_stock = max(0, before + quantity)
    item.stock = new_stock

    movement = StockMovement(
        product_id=product_id,
        quantity=quantity,
        type="in" if quantity > 0 else "out",
        reason=reason,
        before_stock=before,
        after_stock=new_stock,
        user_id=user_id,
    )
    db.add(movement)
    db.commit()
    db.refresh(item)

    return {"item": item, "movement": movement}


def receive_from_purchase(db: Session, purchase_order: dict, user_id: str) -> dict:
    product_name = purchase_order["item"]
    qty = purchase_order["qty"]
    order_id = purchase_order["id"]
    supplier = purchase_order["supplier"]
    total = purchase_order["total"]

    existing = db.query(InventoryItem).filter(
        InventoryItem.name.ilike(product_name)
    ).first()

    if existing:
        result = adjust_stock(
            db, existing.id, qty,
            f"Recepción OC {order_id} — {supplier}",
            user_id,
        )
        item = result["item"]
    else:
        unit_price = round(total / qty) if qty > 0 else 0
        item = InventoryItem(
            name=product_name,
            sku=f"SKU-{order_id}",
            category="General",
            stock=qty,
            price=unit_price,
            cost=unit_price,
            description=f"Recibido de {supplier} vía {order_id}",
        )
        db.add(item)
        db.flush()

        movement = StockMovement(
            product_id=item.id,
            quantity=qty,
            type="in",
            reason=f"Recepción OC {order_id} — {supplier}",
            before_stock=0,
            after_stock=qty,
            user_id=user_id,
        )
        db.add(movement)
        db.commit()
        db.refresh(item)

    return {"item": item, "order_id": order_id, "qty": qty}


def check_stock_available(db: Session, product_id: str, quantity: int) -> bool:
    item = db.query(InventoryItem).filter(InventoryItem.id == product_id).first()
    if not item:
        return False
    return item.stock >= quantity


def deduct_sale_stock(db: Session, product_id: str, quantity: int, reason: str, user_id: str) -> dict:
    if not check_stock_available(db, product_id, quantity):
        raise HTTPException(
            status_code=400,
            detail="Stock insuficiente para realizar la venta"
        )
    return adjust_stock(db, product_id, -quantity, reason, user_id)
