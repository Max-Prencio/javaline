import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, JSON, Boolean
from ..database import Base


class CashRegister(Base):
    __tablename__ = "cash_registers"

    id = Column(String, primary_key=True, default=lambda: f"CAJ-{uuid.uuid4().hex[:6].upper()}")
    user_id = Column(String, nullable=False, index=True)
    open_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    close_date = Column(DateTime, nullable=True)
    initial_balance = Column(Float, default=0)
    current_balance = Column(Float, default=0)
    total_income = Column(Float, default=0)
    total_expense = Column(Float, default=0)
    status = Column(String(20), default="open")
    currency = Column(String(10), default="DOP")
    transactions = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
