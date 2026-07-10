from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware import get_current_user, require_role
from ..models.user import User
from ..models.approval_hierarchy import ApprovalHierarchy
from ..schemas.approval_hierarchy import (
    HierarchyCreate, HierarchyUpdate, HierarchyResponse, CanApproveRequest,
)

router = APIRouter(prefix="/approval-hierarchies", tags=["approval-hierarchies"])


@router.get("", response_model=list[HierarchyResponse])
def list_hierarchies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(ApprovalHierarchy).order_by(ApprovalHierarchy.min_amount).all()


@router.get("/default", response_model=list[HierarchyResponse])
def get_default_hierarchies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(ApprovalHierarchy).order_by(ApprovalHierarchy.min_amount).all()


@router.get("/{hierarchy_id}", response_model=HierarchyResponse)
def get_hierarchy(
    hierarchy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    h = db.query(ApprovalHierarchy).filter(ApprovalHierarchy.id == hierarchy_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    return h


@router.post("", response_model=HierarchyResponse)
def create_hierarchy(
    data: HierarchyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    h = ApprovalHierarchy(
        currency=data.currency,
        role=data.role,
        min_amount=data.min_amount,
        max_amount=data.max_amount,
        created_by=current_user.id,
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.put("/{hierarchy_id}", response_model=HierarchyResponse)
def update_hierarchy(
    hierarchy_id: str, data: HierarchyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    h = db.query(ApprovalHierarchy).filter(ApprovalHierarchy.id == hierarchy_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(h, key, val)
    db.commit()
    db.refresh(h)
    return h


@router.delete("/{hierarchy_id}")
def delete_hierarchy(
    hierarchy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    h = db.query(ApprovalHierarchy).filter(ApprovalHierarchy.id == hierarchy_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    db.delete(h)
    db.commit()
    return {"message": "Regla eliminada"}


@router.post("/can-approve")
def can_approve(
    data: CanApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rules = db.query(ApprovalHierarchy).filter(
        ApprovalHierarchy.role == data.user_role,
        ApprovalHierarchy.currency == data.currency,
        ApprovalHierarchy.min_amount <= data.order_total,
        ApprovalHierarchy.max_amount >= data.order_total,
    ).all()
    return {"can_approve": len(rules) > 0, "rules": rules}
