import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from ..database import Base


class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), default="General")
    stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=10)
    price = Column(Float, default=0)
    cost = Column(Float, default=0)
    location = Column(String(100), default="")
    unit = Column(String(50), default="unidad")
    description = Column(Text, default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    stock_movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="product")
