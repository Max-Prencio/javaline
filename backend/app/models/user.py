import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="employee")
    phone = Column(String(50), default="")
    position = Column(String(150), default="")
    bio = Column(String(500), default="")
    notification_email = Column(String(255), default="")
    alt_email = Column(String(255), default="")
    photo = Column(String, default="")
    status = Column(String(20), default="active")
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    approvals = relationship("Approval", back_populates="approver")
    purchase_orders = relationship("PurchaseOrder", back_populates="creator")
    stock_movements = relationship("StockMovement", back_populates="user")
