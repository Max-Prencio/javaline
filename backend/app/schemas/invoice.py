from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, Any
from datetime import datetime
import re


def to_snake(s: str) -> str:
    return re.sub(r'(?<!^)(?=[A-Z])', '_', s).lower()


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode='before')
    @classmethod
    def convert_camel_to_snake(cls, data):
        if isinstance(data, dict):
            return {to_snake(k): v for k, v in data.items()}
        return data


class InvoiceCreate(CamelModel):
    type: str = "client"
    client_name: str = ""
    client_id: Optional[str] = None
    rnc: str = ""
    date: str = ""
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


class InvoiceUpdate(CamelModel):
    status: Optional[str] = None
    client_name: Optional[str] = None
    client_id: Optional[str] = None
    rnc: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None
    currency: Optional[str] = None
    payment_type: Optional[str] = None
    payment_method: Optional[str] = None
    items: Optional[list] = None
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    discount_type: Optional[str] = None
    discount_amount: Optional[float] = None
    taxable_base: Optional[float] = None
    tax_rate_id: Optional[str] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
    installment_plan: Optional[Any] = None
    cash_register_id: Optional[str] = None
    amount_received: Optional[float] = None
    change_returned: Optional[float] = None
    paid_at: Optional[str] = None
    rectified_by: Optional[str] = None
    rectifies_id: Optional[str] = None


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
