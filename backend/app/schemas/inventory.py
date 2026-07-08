from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InventoryCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    category: str = "General"
    stock: int = 0
    min_stock: int = 10
    price: float = 0
    cost: float = 0
    location: str = ""
    unit: str = "unidad"
    description: str = ""


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    min_stock: Optional[int] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    location: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class InventoryResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    stock: int
    min_stock: int
    price: float
    cost: float
    location: str
    unit: str
    description: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StockAdjustment(BaseModel):
    quantity: int
    reason: str


class StockMovementResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    type: str
    reason: str
    before_stock: int
    after_stock: int
    user_id: Optional[str] = None
    date: datetime

    class Config:
        from_attributes = True
