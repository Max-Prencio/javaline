from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BranchCreate(BaseModel):
    name: str
    address: str = ""
    phone: str = ""
    email: str = ""
    manager: str = ""


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    manager: Optional[str] = None


class BranchResponse(BaseModel):
    id: str
    name: str
    address: str
    phone: str
    email: str
    manager: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True
