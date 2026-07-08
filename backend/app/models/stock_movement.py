import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("inventory.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    type = Column(String(10), nullable=False)
    reason = Column(Text, default="")
    before_stock = Column(Integer, nullable=False)
    after_stock = Column(Integer, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    product = relationship("InventoryItem", back_populates="stock_movements")
    user = relationship("User", back_populates="stock_movements")
