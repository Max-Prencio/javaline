import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..middleware import get_current_user
from ..models.user import User
from ..models.business_context import BusinessContext

router = APIRouter(prefix="/ai/context", tags=["ai"])


@router.get("")
def list_context(
    category: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id or "default"
    query = db.query(BusinessContext).filter(
        BusinessContext.tenant_id == tenant_id,
        BusinessContext.active == True,
    )
    if category:
        query = query.filter(BusinessContext.category == category)
    entries = query.order_by(BusinessContext.created_at.desc()).all()
    return [{
        "id": e.id, "title": e.title, "content": e.content,
        "category": e.category, "tenant_id": e.tenant_id,
        "created_at": e.created_at.isoformat() if e.created_at else "",
    } for e in entries]


@router.post("")
def create_context(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id or "default"
    ctx = BusinessContext(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        title=data.get("title", ""),
        content=data.get("content", ""),
        category=data.get("category", "general"),
    )
    db.add(ctx)
    db.commit()
    db.refresh(ctx)
    return {
        "id": ctx.id, "title": ctx.title, "content": ctx.content,
        "category": ctx.category, "tenant_id": ctx.tenant_id,
        "created_at": ctx.created_at.isoformat() if ctx.created_at else "",
    }


@router.put("/{ctx_id}")
def update_context(
    ctx_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = db.query(BusinessContext).filter(
        BusinessContext.id == ctx_id,
        BusinessContext.tenant_id == (current_user.tenant_id or "default"),
    ).first()
    if not ctx:
        raise HTTPException(404, "Contexto no encontrado")
    if "title" in data:
        ctx.title = data["title"]
    if "content" in data:
        ctx.content = data["content"]
    if "category" in data:
        ctx.category = data["category"]
    db.commit()
    db.refresh(ctx)
    return {
        "id": ctx.id, "title": ctx.title, "content": ctx.content,
        "category": ctx.category, "tenant_id": ctx.tenant_id,
        "created_at": ctx.created_at.isoformat() if ctx.created_at else "",
    }


@router.delete("/{ctx_id}")
def delete_context(
    ctx_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = db.query(BusinessContext).filter(
        BusinessContext.id == ctx_id,
        BusinessContext.tenant_id == (current_user.tenant_id or "default"),
    ).first()
    if not ctx:
        raise HTTPException(404, "Contexto no encontrado")
    ctx.active = False
    db.commit()
    return {"message": "Contexto eliminado"}
