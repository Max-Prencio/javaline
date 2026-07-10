from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HierarchyCreate(BaseModel):
    currency: str = "DOP"
    role: str
    min_amount: float = 0
    max_amount: float = 999999


class HierarchyUpdate(BaseModel):
    currency: Optional[str] = None
    role: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None


class HierarchyResponse(BaseModel):
    id: str
    currency: str
    role: str
    min_amount: float
    max_amount: float
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CanApproveRequest(BaseModel):
    order_total: float
    currency: str = "DOP"
    user_role: str
