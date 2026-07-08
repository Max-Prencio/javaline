from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware import get_current_user, require_role
from ..models.user import User
from ..models.purchase_order import PurchaseOrder
from ..schemas.purchase_order import ApprovalCreate
from ..services import approval_service

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("/pending")
def list_pending_approvals(db: Session = Depends(get_db),
                           current_user: User = Depends(require_role("manager", "admin"))):
    orders = db.query(PurchaseOrder).filter(
        PurchaseOrder.status == "pending_approval"
    ).order_by(PurchaseOrder.created_at.desc()).all()
    return orders


@router.post("/{order_id}/approve")
def approve_order(order_id: str, data: ApprovalCreate,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(require_role("manager", "admin"))):
    return approval_service.approve_order(
        db, order_id, current_user.id,
        data.amount_approved, data.comment,
    )


@router.post("/{order_id}/reject")
def reject_order(order_id: str, data: ApprovalCreate,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(require_role("manager", "admin"))):
    return approval_service.reject_order(
        db, order_id, current_user.id, data.comment,
    )


@router.get("/history")
def list_approval_history(db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    from ..models.approval import Approval
    approvals = db.query(Approval).order_by(Approval.approved_at.desc()).limit(50).all()
    return approvals
