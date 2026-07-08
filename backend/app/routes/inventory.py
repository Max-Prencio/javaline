from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..middleware import get_current_user
from ..models.user import User
from ..models.inventory import InventoryItem
from ..schemas.inventory import (
    InventoryCreate, InventoryUpdate, InventoryResponse,
    StockAdjustment, StockMovementResponse,
)
from ..services import stock_service

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryResponse])
def list_inventory(
    search: Optional[str] = None,
    category: Optional[str] = None,
    stock_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(InventoryItem).filter(InventoryItem.active == True)
    if search:
        query = query.filter(
            InventoryItem.name.ilike(f"%{search}%") |
            InventoryItem.sku.ilike(f"%{search}%")
        )
    if category:
        query = query.filter(InventoryItem.category == category)
    if stock_filter == "low":
        query = query.filter(InventoryItem.stock <= InventoryItem.min_stock)
    if stock_filter == "out":
        query = query.filter(InventoryItem.stock <= 0)
    return query.order_by(InventoryItem.name).all()


@router.get("/{product_id}", response_model=InventoryResponse)
def get_product(product_id: str, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return item


@router.post("", response_model=InventoryResponse)
def create_product(data: InventoryCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    import uuid
    item = InventoryItem(
        name=data.name,
        sku=data.sku or f"SKU-{uuid.uuid4().hex[:8].upper()}",
        category=data.category,
        stock=data.stock,
        min_stock=data.min_stock,
        price=data.price,
        cost=data.cost,
        location=data.location,
        unit=data.unit,
        description=data.description,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{product_id}", response_model=InventoryResponse)
def update_product(product_id: str, data: InventoryUpdate,
                   db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(item, key, val)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    item.active = False
    db.commit()
    return {"message": "Producto desactivado"}


@router.post("/{product_id}/adjust")
def adjust_stock(product_id: str, data: StockAdjustment,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    return stock_service.adjust_stock(
        db, product_id, data.quantity, data.reason, current_user.id,
    )


@router.get("/{product_id}/movements", response_model=list[StockMovementResponse])
def list_movements(product_id: str, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    from ..models.stock_movement import StockMovement
    movements = db.query(StockMovement).filter(
        StockMovement.product_id == product_id
    ).order_by(StockMovement.date.desc()).limit(50).all()
    return movements


@router.get("/stats/summary")
def inventory_stats(db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    items = db.query(InventoryItem).filter(InventoryItem.active == True).all()
    total_products = len(items)
    total_stock = sum(i.stock for i in items)
    total_value = sum((i.stock or 0) * (i.cost or 0) for i in items)
    low_stock = sum(1 for i in items if i.stock <= i.min_stock)
    categories = len(set(i.category for i in items))
    return {
        "totalProducts": total_products,
        "totalStock": total_stock,
        "totalValue": total_value,
        "lowStock": low_stock,
        "categories": categories,
    }
