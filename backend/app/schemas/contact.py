from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ContactCreate(BaseModel):
    name: str
    company: str = ""
    rnc: str = ""
    email: str = ""
    phone: str = ""
    type: str = "client"
    address: str = ""
    notes: str = ""


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    rnc: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    id: str
    name: str
    company: str
    rnc: str
    email: str
    phone: str
    type: str
    address: str
    notes: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True
