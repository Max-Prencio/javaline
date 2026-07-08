import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String, primary_key=True, default=lambda: f"OC-{uuid.uuid4().hex[:6].upper()}")
    supplier = Column(String(255), nullable=False)
    item = Column(String(255), nullable=False)
    qty = Column(Integer, nullable=False)
    currency = Column(String(10), default="DOP")
    total = Column(Float, nullable=False)
    status = Column(String(20), default="solicitud", index=True)
    notes = Column(Text, default="")
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    received_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("User", back_populates="purchase_orders")
    approvals = relationship("Approval", back_populates="purchase_order", cascade="all, delete-orphan")
