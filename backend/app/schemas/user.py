from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    bio: Optional[str] = None
    notification_email: Optional[str] = None
    alt_email: Optional[str] = None
    photo: Optional[str] = None


class UserPhotoUpdate(BaseModel):
    photo: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: str
    position: str
    bio: str
    notification_email: str
    alt_email: str
    photo: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    id: str
    current_password: str
    new_password: str


class ChangePasswordAdminRequest(BaseModel):
    id: str
    new_password: str


class InviteRequest(BaseModel):
    email: str
    invited_by: str
