from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..middleware import get_current_user
from ..models.user import User
from ..models.sale import Sale
from ..schemas.sale import SaleCreate, SaleResponse
from ..services import stock_service

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("")
def list_sales(
    product_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Sale).order_by(Sale.created_at.desc())
    if product_id:
        query = query.filter(Sale.product_id == product_id)
    return query.limit(limit).all()


@router.post("", response_model=SaleResponse)
def create_sale(data: SaleCreate, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    # Verificar stock antes de vender
    stock_service.deduct_sale_stock(
        db, data.product_id, data.quantity,
        f"Venta a {data.customer or 'cliente'}", current_user.id,
    )

    sale = Sale(
        product_id=data.product_id,
        quantity=data.quantity,
        unit_price=data.unit_price,
        total=data.quantity * data.unit_price,
        customer=data.customer,
        user_id=current_user.id,
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale


@router.get("/check-stock/{product_id}")
def check_stock(product_id: str, quantity: int = 1,
                db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    available = stock_service.check_stock_available(db, product_id, quantity)
    return {"available": available, "product_id": product_id, "quantity": quantity}
