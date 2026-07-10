import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Date, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), default="")
    department = Column(String(100), default="")
    position = Column(String(150), default="")
    salary = Column(Float, default=0)
    salary_type = Column(String(20), default="monthly")
    hire_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    contract_type = Column(String(30), default="fijo")
    status = Column(String(20), default="active")
    photo = Column(String, default="")
    supervisor_id = Column(String, ForeignKey("employees.id"), nullable=True)
    rnc = Column(String(30), default="")
    tss_number = Column(String(30), default="")
    ars = Column(String(100), default="")
    afp = Column(String(100), default="")
    bank_account = Column(String(50), default="")
    emergency_contact = Column(String(255), default="")
    emergency_phone = Column(String(50), default="")
    punch_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="employee_profile", uselist=False)
    supervisor = relationship("Employee", remote_side=[id], backref="subordinates")
    vacations = relationship("Vacation", back_populates="employee", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")
    deductions = relationship("Deduction", back_populates="employee", cascade="all, delete-orphan")
    evaluations = relationship("PerformanceEvaluation", back_populates="employee", cascade="all, delete-orphan",
                               foreign_keys="PerformanceEvaluation.employee_id")


class Vacation(Base):
    __tablename__ = "vacations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    vacation_type = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    year = Column(Integer, nullable=True)
    is_recurring = Column(Boolean, default=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="vacations")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    clock_in = Column(String(10), nullable=True)
    clock_out = Column(String(10), nullable=True)
    break_start = Column(String(10), nullable=True)
    break_end = Column(String(10), nullable=True)
    total_hours = Column(Float, default=0)
    overtime_hours = Column(Float, default=0)
    missing_hours = Column(Float, default=0)
    status = Column(String(20), default="present")
    source = Column(String(30), default="manual")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="attendances")


class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    gross_salary = Column(Float, default=0)
    total_deductions = Column(Float, default=0)
    net_salary = Column(Float, default=0)
    bonuses = Column(Float, default=0)
    overtime_pay = Column(Float, default=0)
    status = Column(String(20), default="draft")
    paid_at = Column(DateTime, nullable=True)
    payment_method = Column(String(30), default="transfer")
    receipt_sent = Column(Boolean, default=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="payrolls")


class Deduction(Base):
    __tablename__ = "deductions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    name = Column(String(100), nullable=False)
    deduction_type = Column(String(50), nullable=False)
    amount = Column(Float, default=0)
    percentage = Column(Float, default=0)
    is_mandatory = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="deductions")


class PerformanceEvaluation(Base):
    __tablename__ = "performance_evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    evaluator_id = Column(String, ForeignKey("users.id"), nullable=True)
    evaluation_date = Column(Date, nullable=False)
    score = Column(Float, default=0)
    max_score = Column(Float, default=100)
    category = Column(String(50), default="general")
    strengths = Column(Text, default="")
    weaknesses = Column(Text, default="")
    recommendations = Column(Text, default="")
    criteria_scores = Column(JSON, default=dict)
    status = Column(String(20), default="draft")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="evaluations", foreign_keys=[employee_id])


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    questions = Column(JSON, default=list)
    status = Column(String(20), default="draft")
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    survey_id = Column(String, ForeignKey("surveys.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=True)
    answers = Column(JSON, default=dict)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ATSCandidate(Base):
    __tablename__ = "ats_candidates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), default="")
    phone = Column(String(50), default="")
    position_applied = Column(String(150), default="")
    resume_file = Column(String, default="")
    resume_text = Column(Text, default="")
    position_descr_file = Column(String, default="")
    ai_analysis = Column(JSON, default=dict)
    classification = Column(String(30), default="pending")
    score = Column(Float, default=0)
    strengths = Column(Text, default="")
    weaknesses = Column(Text, default="")
    recommendations = Column(Text, default="")
    status = Column(String(30), default="new")
    evaluated_by = Column(String(100), nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class HRPosition(Base):
    __tablename__ = "hr_positions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(50), default="default", index=True)
    name = Column(String(150), nullable=False)
    description_file = Column(String, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
