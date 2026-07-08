from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SaleCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    customer: str = ""


class SaleResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    unit_price: float
    total: float
    customer: str
    user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
