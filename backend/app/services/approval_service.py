from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from ..models.purchase_order import PurchaseOrder
from ..models.approval import Approval
from ..models.user import User
from .email_service import send_approval_request, send_approval_notification


def request_approval(db: Session, order_id: str):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    if order.status != "solicitud":
        raise HTTPException(status_code=400, detail=f"La orden ya está en estado: {order.status}")

    order.status = "pending_approval"
    db.commit()

    approvers = db.query(User).filter(
        User.role.in_(["manager", "admin"]),
        User.status == "active"
    ).all()

    for approver in approvers:
        send_approval_request(
            {"id": order.id, "supplier": order.supplier,
             "total": order.total, "currency": order.currency,
             "creator_email": None},
            approver.email,
        )

    return order


def approve_order(db: Session, order_id: str, user_id: str,
                  amount_approved: float = None, comment: str = ""):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ("manager", "admin"):
        raise HTTPException(status_code=403, detail="No tienes permisos para aprobar")

    approval = Approval(
        purchase_order_id=order_id,
        approved_by=user_id,
        status="approved",
        amount_approved=amount_approved or order.total,
        comment=comment,
        approved_at=datetime.now(timezone.utc),
    )
    db.add(approval)

    order.status = "aprobado"
    order.notes = (f"Aprobado por {user.name} el "
                   f"{datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')} "
                   f"- Monto: ${amount_approved or order.total:,.2f} {order.currency}")
    db.commit()
    db.refresh(order)

    send_approval_notification(
        {"id": order.id, "creator_email": None},
        True, user.name,
    )

    return {"order": order, "approval": approval}


def reject_order(db: Session, order_id: str, user_id: str, comment: str = ""):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ("manager", "admin"):
        raise HTTPException(status_code=403, detail="No tienes permisos para rechazar")

    approval = Approval(
        purchase_order_id=order_id,
        approved_by=user_id,
        status="rejected",
        amount_approved=0,
        comment=comment or "Solicitud rechazada",
        approved_at=datetime.now(timezone.utc),
    )
    db.add(approval)

    order.status = "rechazado"
    order.notes = f"Rechazado por {user.name}: {comment}"
    db.commit()
    db.refresh(order)

    send_approval_notification(
        {"id": order.id, "creator_email": None},
        False, user.name,
    )

    return {"order": order, "approval": approval}
