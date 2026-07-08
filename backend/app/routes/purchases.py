from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models.purchase_order import PurchaseOrder
from ..schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderResponse
from ..middleware import get_current_user, require_role
from ..models.user import User
from ..services import stock_service

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.get("", response_model=list[PurchaseOrderResponse])
def list_orders(status: Optional[str] = None, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    query = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc())
    if status:
        query = query.filter(PurchaseOrder.status == status)
    return query.all()


@router.get("/{order_id}", response_model=PurchaseOrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db),
              current_user: User = Depends(get_current_user)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return order


@router.post("", response_model=PurchaseOrderResponse)
def create_order(data: PurchaseOrderCreate, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    auto_approve = current_user.role in ("admin", "manager") and data.total < 100000
    order = PurchaseOrder(
        supplier=data.supplier,
        item=data.item,
        qty=data.qty,
        currency=data.currency,
        total=data.total,
        status="aprobado" if auto_approve else "solicitud",
        created_by=current_user.id,
        notes="" if auto_approve else "Pendiente de aprobación",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/receive")
def receive_order(order_id: str, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if order.status != "aprobado":
        raise HTTPException(status_code=400, detail="Solo órdenes aprobadas pueden recibirse")

    result = stock_service.receive_from_purchase(db, {
        "id": order.id,
        "item": order.item,
        "qty": order.qty,
        "supplier": order.supplier,
        "total": order.total,
    }, current_user.id)

    from datetime import datetime, timezone
    order.status = "recibido"
    order.received_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Orden recibida en inventario", "item": result["item"].id,
            "product": result["item"].name, "qty": result["qty"]}
