from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware import get_current_user, require_role
from ..models.user import User
from ..models.branch import Branch
from ..schemas.branch import BranchCreate, BranchUpdate, BranchResponse

router = APIRouter(prefix="/branches", tags=["branches"])


@router.get("", response_model=list[BranchResponse])
def list_branches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Branch).filter(Branch.active == True).order_by(Branch.name).all()


@router.get("/{branch_id}", response_model=BranchResponse)
def get_branch(
    branch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    b = db.query(Branch).filter(Branch.id == branch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return b


@router.post("", response_model=BranchResponse)
def create_branch(
    data: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    branch = Branch(**data.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch


@router.put("/{branch_id}", response_model=BranchResponse)
def update_branch(
    branch_id: str, data: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(branch, key, val)
    db.commit()
    db.refresh(branch)
    return branch


@router.delete("/{branch_id}")
def delete_branch(
    branch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    branch.active = False
    db.commit()
    return {"message": "Sucursal desactivada"}
