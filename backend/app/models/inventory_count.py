import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text
from ..database import Base


class InventoryCount(Base):
    __tablename__ = "inventory_counts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(150), nullable=False)
    user_name = Column(String(150), default="")
    product_id = Column(String(150), nullable=False)
    product_name = Column(String(255), nullable=False)
    sku = Column(String(100), default="")
    warehouse = Column(String(100), default="")
    shelf = Column(String(50), default="")
    row = Column(String(50), default="")
    box = Column(String(50), default="")
    scanned_count = Column(Integer, default=0)
    status = Column(String(20), default="pending")
    session_id = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
