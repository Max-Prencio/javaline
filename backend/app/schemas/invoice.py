from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class InvoiceCreate(BaseModel):
    type: str = "client"
    client_name: str
    client_id: Optional[str] = None
    rnc: str = ""
    date: str
    due_date: str = ""
    currency: str = "DOP"
    payment_type: str = "debit"
    payment_method: str = "transfer"
    items: list = []
    subtotal: float = 0
    discount: float = 0
    discount_type: str = "percentage"
    discount_amount: float = 0
    taxable_base: float = 0
    tax_rate_id: str = "TAX-001"
    tax: float = 0
    total: float = 0
    notes: str = ""
    installment_plan: Optional[Any] = None
    cash_register_id: Optional[str] = None
    amount_received: float = 0
    change_returned: float = 0
    status: str = "pending"


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    client_name: Optional[str] = None
    payment_method: Optional[str] = None
    paid_at: Optional[str] = None
    notes: Optional[str] = None
    amount_received: Optional[float] = None
    change_returned: Optional[float] = None


class InvoiceResponse(BaseModel):
    id: str
    type: str
    client_name: str
    client_id: Optional[str]
    rnc: str
    date: str
    due_date: str
    currency: str
    payment_type: str
    payment_method: str
    items: Any
    subtotal: float
    discount: float
    discount_type: str
    discount_amount: float
    taxable_base: float
    tax_rate_id: str
    tax: float
    total: float
    status: str
    notes: str
    installment_plan: Optional[Any]
    cash_register_id: Optional[str]
    amount_received: float
    change_returned: float
    rectifies_id: Optional[str]
    created_by: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
