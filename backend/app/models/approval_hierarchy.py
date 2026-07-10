import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from ..database import Base


class ApprovalHierarchy(Base):
    __tablename__ = "approval_hierarchies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    currency = Column(String(10), default="DOP")
    role = Column(String(50), nullable=False)
    min_amount = Column(Float, default=0)
    max_amount = Column(Float, default=999999)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
