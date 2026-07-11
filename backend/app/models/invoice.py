import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from ..database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: f"INV-{uuid.uuid4().hex[:6].upper()}")
    type = Column(String(20), default="client")
    client_name = Column(String(255), nullable=False)
    client_id = Column(String, nullable=True)
    rnc = Column(String(50), default="")
    date = Column(String(20), nullable=False)
    due_date = Column(String(20), default="")
    currency = Column(String(10), default="DOP")
    payment_type = Column(String(20), default="debit")
    payment_method = Column(String(30), default="transfer")
    items = Column(JSON, default=list)
    subtotal = Column(Float, default=0)
    discount = Column(Float, default=0)
    discount_type = Column(String(20), default="percentage")
    discount_amount = Column(Float, default=0)
    taxable_base = Column(Float, default=0)
    tax_rate_id = Column(String(50), default="TAX-001")
    tax = Column(Float, default=0)
    total = Column(Float, default=0)
    status = Column(String(20), default="pending", index=True)
    notes = Column(Text, default="")
    installment_plan = Column(JSON, nullable=True)
    cash_register_id = Column(String, nullable=True)
    amount_received = Column(Float, default=0)
    change_returned = Column(Float, default=0)
    rectifies_id = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
