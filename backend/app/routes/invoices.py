from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..middleware import get_current_user
from ..models.user import User
from ..models.invoice import Invoice
from ..schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Invoice)
    if status:
        query = query.filter(Invoice.status == status)
    if search:
        query = query.filter(
            Invoice.client_name.ilike(f"%{search}%") | Invoice.id.ilike(f"%{search}%")
        )
    return query.order_by(Invoice.created_at.desc()).limit(100).all()


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return inv


@router.post("", response_model=InvoiceResponse)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import uuid
    inv = Invoice(
        type=data.type,
        client_name=data.client_name,
        client_id=data.client_id,
        rnc=data.rnc,
        date=data.date,
        due_date=data.due_date,
        currency=data.currency,
        payment_type=data.payment_type,
        payment_method=data.payment_method,
        items=data.items,
        subtotal=data.subtotal,
        discount=data.discount,
        discount_type=data.discount_type,
        discount_amount=data.discount_amount,
        taxable_base=data.taxable_base,
        tax_rate_id=data.tax_rate_id,
        tax=data.tax,
        total=data.total,
        notes=data.notes,
        installment_plan=data.installment_plan,
        cash_register_id=data.cash_register_id,
        status=data.status,
        created_by=current_user.id,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str, data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(inv, key, val)
    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    db.delete(inv)
    db.commit()
    return {"message": "Factura eliminada"}
