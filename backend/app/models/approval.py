import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    purchase_order_id = Column(String, ForeignKey("purchase_orders.id"), nullable=False, index=True)
    approved_by = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), nullable=False, default="approved")
    amount_approved = Column(Float, nullable=True)
    comment = Column(Text, default="")
    approved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    purchase_order = relationship("PurchaseOrder", back_populates="approvals")
    approver = relationship("User", back_populates="approvals")
