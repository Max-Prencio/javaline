from pydantic import BaseModel
from typing import Optional, Any
from datetime import date, datetime


class EmployeeCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    department: str = ""
    position: str = ""
    salary: float = 0
    salary_type: str = "monthly"
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    contract_type: str = "fijo"
    status: str = "active"
    photo: str = ""
    supervisor_id: Optional[str] = None
    rnc: str = ""
    tss_number: str = ""
    ars: str = ""
    afp: str = ""
    bank_account: str = ""
    emergency_contact: str = ""
    emergency_phone: str = ""
    punch_enabled: bool = True


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    salary_type: Optional[str] = None
    hire_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    contract_type: Optional[str] = None
    status: Optional[str] = None
    photo: Optional[str] = None
    supervisor_id: Optional[str] = None
    rnc: Optional[str] = None
    tss_number: Optional[str] = None
    ars: Optional[str] = None
    afp: Optional[str] = None
    bank_account: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    punch_enabled: Optional[bool] = None


class EmployeeResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: Optional[str] = None
    name: str
    email: str
    phone: str
    department: str
    position: str
    salary: float
    salary_type: str
    hire_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    contract_type: str
    status: str
    photo: str
    supervisor_id: Optional[str] = None
    rnc: str
    tss_number: str
    ars: str
    afp: str
    bank_account: str
    emergency_contact: str
    emergency_phone: str
    punch_enabled: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VacationCreate(BaseModel):
    employee_id: str
    vacation_type: str
    start_date: str
    end_date: str
    total_days: int
    year: Optional[int] = None
    is_recurring: bool = False
    notes: str = ""


class VacationUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[str] = None
    notes: Optional[str] = None


class VacationResponse(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    vacation_type: str
    start_date: date
    end_date: date
    total_days: int
    status: str
    approved_by: Optional[str] = None
    year: Optional[int] = None
    is_recurring: bool
    notes: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    employee_id: str
    date: str
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    break_start: Optional[str] = None
    break_end: Optional[str] = None
    total_hours: float = 0
    overtime_hours: float = 0
    missing_hours: float = 0
    status: str = "present"
    source: str = "manual"
    notes: str = ""


class AttendanceUpdate(BaseModel):
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    break_start: Optional[str] = None
    break_end: Optional[str] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    missing_hours: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    date: date
    clock_in: Optional[str] = None
    clock_out: Optional[str] = None
    break_start: Optional[str] = None
    break_end: Optional[str] = None
    total_hours: float
    overtime_hours: float
    missing_hours: float
    status: str
    source: str
    notes: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PayrollCreate(BaseModel):
    employee_id: str
    period_start: str
    period_end: str
    gross_salary: float = 0
    total_deductions: float = 0
    net_salary: float = 0
    bonuses: float = 0
    overtime_pay: float = 0
    payment_method: str = "transfer"
    notes: str = ""


class PayrollUpdate(BaseModel):
    gross_salary: Optional[float] = None
    total_deductions: Optional[float] = None
    net_salary: Optional[float] = None
    bonuses: Optional[float] = None
    overtime_pay: Optional[float] = None
    status: Optional[str] = None
    paid_at: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_sent: Optional[bool] = None
    notes: Optional[str] = None


class PayrollResponse(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    period_start: date
    period_end: date
    gross_salary: float
    total_deductions: float
    net_salary: float
    bonuses: float
    overtime_pay: float
    status: str
    paid_at: Optional[datetime] = None
    payment_method: str
    receipt_sent: bool
    notes: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeductionCreate(BaseModel):
    employee_id: str
    name: str
    deduction_type: str
    amount: float = 0
    percentage: float = 0
    is_mandatory: bool = False
    description: str = ""


class DeductionUpdate(BaseModel):
    name: Optional[str] = None
    deduction_type: Optional[str] = None
    amount: Optional[float] = None
    percentage: Optional[float] = None
    is_mandatory: Optional[bool] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class DeductionResponse(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    name: str
    deduction_type: str
    amount: float
    percentage: float
    is_mandatory: bool
    is_active: bool
    description: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EvaluationCreate(BaseModel):
    employee_id: str
    evaluator_id: Optional[str] = None
    evaluation_date: str
    score: float = 0
    max_score: float = 100
    category: str = "general"
    strengths: str = ""
    weaknesses: str = ""
    recommendations: str = ""
    criteria_scores: dict = {}


class EvaluationUpdate(BaseModel):
    score: Optional[float] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    recommendations: Optional[str] = None
    criteria_scores: Optional[dict] = None
    status: Optional[str] = None


class EvaluationResponse(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    evaluator_id: Optional[str] = None
    evaluation_date: date
    score: float
    max_score: float
    category: str
    strengths: str
    weaknesses: str
    recommendations: str
    criteria_scores: Any = {}
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SurveyCreate(BaseModel):
    title: str
    description: str = ""
    questions: list = []
    status: str = "draft"


class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[list] = None
    status: Optional[str] = None


class SurveyResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    description: str
    questions: Any = []
    status: str
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SurveyAnswerCreate(BaseModel):
    survey_id: str
    employee_id: Optional[str] = None
    answers: dict = {}


class ATSCandidateCreate(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    position_applied: str = ""
    resume_file: str = ""
    position_descr_file: str = ""
    notes: str = ""


class ATSCandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position_applied: Optional[str] = None
    resume_file: Optional[str] = None
    position_descr_file: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ATSCandidateResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    email: str
    phone: str
    position_applied: str
    resume_file: str
    resume_text: str
    position_descr_file: str
    ai_analysis: Any = {}
    classification: str
    score: float
    strengths: str
    weaknesses: str
    recommendations: str
    status: str
    evaluated_by: Optional[str] = None
    notes: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PositionResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description_file: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
