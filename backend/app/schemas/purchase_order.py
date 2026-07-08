from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PurchaseOrderCreate(BaseModel):
    supplier: str
    item: str
    qty: int
    currency: str = "DOP"
    total: float


class PurchaseOrderResponse(BaseModel):
    id: str
    supplier: str
    item: str
    qty: int
    currency: str
    total: float
    status: str
    notes: str
    created_by: Optional[str] = None
    received_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalCreate(BaseModel):
    status: str = "approved"
    amount_approved: Optional[float] = None
    comment: str = ""


class ApprovalResponse(BaseModel):
    id: str
    purchase_order_id: str
    approved_by: str
    status: str
    amount_approved: Optional[float] = None
    comment: str
    approved_at: datetime

    class Config:
        from_attributes = True
