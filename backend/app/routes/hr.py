from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from typing import Optional

from ..database import get_db
from ..middleware import require_role
from ..models.user import User
from ..models.hr import (
    Employee, Vacation, Attendance, Payroll, Deduction,
    PerformanceEvaluation, Survey, SurveyResponse, ATSCandidate, HRPosition,
)
from ..schemas.hr import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    VacationCreate, VacationUpdate, VacationResponse,
    AttendanceCreate, AttendanceUpdate, AttendanceResponse,
    PayrollCreate, PayrollUpdate, PayrollResponse,
    DeductionCreate, DeductionUpdate, DeductionResponse,
    EvaluationCreate, EvaluationUpdate, EvaluationResponse,
    SurveyCreate, SurveyUpdate, SurveyAnswerCreate,
    ATSCandidateCreate, ATSCandidateUpdate, ATSCandidateResponse,
    PositionResponse,
)

router = APIRouter(prefix="/hr", tags=["hr"])


def td(val):
    return val.isoformat() if val else None


def tenant_filter(query, model, db, user):
    tenant = getattr(user, "tenant_id", "default")
    return query.filter(model.tenant_id == tenant)


# ─── EMPLOYEES ───────────────────────────────────────────────

@router.get("/employees")
def list_employees(
    search: str = "", department: str = "", status: str = "",
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Employee), Employee, db, current_user)
    if search:
        like = f"%{search}%"
        q = q.filter(Employee.name.ilike(like) | Employee.position.ilike(like) | Employee.department.ilike(like))
    if department:
        q = q.filter(Employee.department == department)
    if status:
        q = q.filter(Employee.status == status)
    return q.order_by(Employee.name).all()


@router.get("/employees/departments")
def list_departments(
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Employee.department).distinct(), Employee, db, current_user)
    return [r[0] for r in q.all() if r[0]]


@router.get("/employees/stats")
def employee_stats(
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Employee), Employee, db, current_user)
    total = q.count()
    active = q.filter(Employee.status == "active").count()
    payroll = db.query(func.sum(Employee.salary)).filter(
        Employee.tenant_id == getattr(current_user, "tenant_id", "default")
    ).scalar() or 0
    dept_count = db.query(Employee.department).filter(
        Employee.tenant_id == getattr(current_user, "tenant_id", "default"),
        Employee.department != "",
    ).distinct().count()
    return {
        "total": total, "active": active,
        "monthly_payroll": round(payroll, 2),
        "departments": dept_count,
    }


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "employee")),
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    return emp


@router.post("/employees", response_model=EmployeeResponse, status_code=201)
def create_employee(
    req: EmployeeCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    emp = Employee(**req.model_dump(), tenant_id=getattr(current_user, "tenant_id", "default"))
    if req.hire_date:
        emp.hire_date = date.fromisoformat(req.hire_date)
    if req.contract_end_date:
        emp.contract_end_date = date.fromisoformat(req.contract_end_date)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str, req: EmployeeUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    for field, val in req.model_dump(exclude_unset=True).items():
        if field in ("hire_date", "contract_end_date") and val:
            val = date.fromisoformat(val)
        setattr(emp, field, val)
    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    db.delete(emp)
    db.commit()
    return {"message": "Empleado eliminado"}


# ─── VACATIONS ──────────────────────────────────────────────

@router.get("/vacations")
def list_vacations(
    employee_id: str = "", status: str = "", year: Optional[int] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Vacation), Vacation, db, current_user)
    if employee_id:
        q = q.filter(Vacation.employee_id == employee_id)
    if status:
        q = q.filter(Vacation.status == status)
    if year:
        q = q.filter(Vacation.year == year)
    return q.order_by(Vacation.start_date.desc()).all()


@router.post("/vacations", status_code=201)
def create_vacation(
    req: VacationCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    vac = Vacation(**req.model_dump(), tenant_id=getattr(current_user, "tenant_id", "default"))
    vac.start_date = date.fromisoformat(req.start_date)
    vac.end_date = date.fromisoformat(req.end_date)
    db.add(vac)
    db.commit()
    db.refresh(vac)
    return vac


@router.put("/vacations/{vacation_id}")
def update_vacation(
    vacation_id: str, req: VacationUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    vac = db.query(Vacation).filter(
        Vacation.id == vacation_id,
        Vacation.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not vac:
        raise HTTPException(404, "Vacación no encontrada")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(vac, field, val)
    db.commit()
    db.refresh(vac)
    return vac


@router.get("/vacations/available/{employee_id}")
def vacation_available(
    employee_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "employee")),
):
    total = 14
    used = db.query(func.sum(Vacation.total_days)).filter(
        Vacation.employee_id == employee_id,
        Vacation.year == date.today().year,
        Vacation.status.in_(["approved", "taken"]),
    ).scalar() or 0
    pending = db.query(func.sum(Vacation.total_days)).filter(
        Vacation.employee_id == employee_id,
        Vacation.year == date.today().year,
        Vacation.status == "pending",
    ).scalar() or 0
    return {"total": total, "used": used, "pending": pending, "available": total - used - pending}


# ─── ATTENDANCE ─────────────────────────────────────────────

@router.get("/attendance")
def list_attendance(
    employee_id: str = "", date_from: str = "", date_to: str = "",
    status: str = "", db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Attendance), Attendance, db, current_user)
    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if date_from:
        q = q.filter(Attendance.date >= date.fromisoformat(date_from))
    if date_to:
        q = q.filter(Attendance.date <= date.fromisoformat(date_to))
    if status:
        q = q.filter(Attendance.status == status)
    return q.order_by(Attendance.date.desc()).all()


@router.post("/attendance/punch")
def punch_clock(
    employee_id: str = Query(...), action: str = Query(...),
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager", "employee")),
):
    today = date.today()
    now_str = datetime.now().strftime("%H:%M")
    att = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.date == today,
    ).first()
    if not att:
        if action != "in":
            raise HTTPException(400, "Debe marcar entrada primero")
        att = Attendance(
            employee_id=employee_id, date=today, clock_in=now_str,
            status="present", source="manual",
            tenant_id=getattr(current_user, "tenant_id", "default"),
        )
        db.add(att)
    else:
        if action == "in":
            raise HTTPException(400, "Entrada ya marcada hoy")
        elif action == "out":
            att.clock_out = now_str
            if att.clock_in:
                hi, mi = map(int, att.clock_in.split(":"))
                ho, mo = map(int, now_str.split(":"))
                att.total_hours = round((ho * 60 + mo - hi * 60 - mi) / 60, 2)
                if att.total_hours > 8:
                    att.overtime_hours = round(att.total_hours - 8, 2)
                    att.missing_hours = 0
                elif att.total_hours < 8:
                    att.missing_hours = round(8 - att.total_hours, 2)
                    att.overtime_hours = 0
        elif action == "break_start":
            att.break_start = now_str
        elif action == "break_end":
            att.break_end = now_str
    db.commit()
    db.refresh(att)
    return att


@router.get("/attendance/summary/{employee_id}")
def attendance_summary(
    employee_id: str, year: Optional[int] = None,
    month: Optional[int] = None, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "employee")),
):
    q = tenant_filter(db.query(Attendance), Attendance, db, current_user).filter(
        Attendance.employee_id == employee_id,
    )
    if year:
        q = q.filter(func.extract("year", Attendance.date) == year)
    if month:
        q = q.filter(func.extract("month", Attendance.date) == month)
    rows = q.all()
    total_hours = sum(r.total_hours for r in rows)
    overtime = sum(r.overtime_hours for r in rows)
    missing = sum(r.missing_hours for r in rows)
    present = sum(1 for r in rows if r.status == "present")
    absent = sum(1 for r in rows if r.status == "absent")
    late = sum(1 for r in rows if r.status == "late")
    return {
        "total_records": len(rows),
        "present": present, "absent": absent, "late": late,
        "total_hours": round(total_hours, 2),
        "overtime_hours": round(overtime, 2),
        "missing_hours": round(missing, 2),
    }


# ─── PAYROLL ────────────────────────────────────────────────

@router.get("/payroll")
def list_payroll(
    employee_id: str = "", status: str = "",
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Payroll), Payroll, db, current_user)
    if employee_id:
        q = q.filter(Payroll.employee_id == employee_id)
    if status:
        q = q.filter(Payroll.status == status)
    return q.order_by(Payroll.period_start.desc()).all()


@router.post("/payroll", status_code=201)
def create_payroll(
    req: PayrollCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    p = Payroll(**req.model_dump(), tenant_id=getattr(current_user, "tenant_id", "default"))
    p.period_start = date.fromisoformat(req.period_start)
    p.period_end = date.fromisoformat(req.period_end)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/payroll/{payroll_id}")
def update_payroll(
    payroll_id: str, req: PayrollUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    p = db.query(Payroll).filter(
        Payroll.id == payroll_id,
        Payroll.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not p:
        raise HTTPException(404, "Nómina no encontrada")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(p, field, val)
    db.commit()
    db.refresh(p)
    return p


@router.post("/payroll/{payroll_id}/pay")
def pay_payroll(
    payroll_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    p = db.query(Payroll).filter(
        Payroll.id == payroll_id,
        Payroll.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not p:
        raise HTTPException(404, "Nómina no encontrada")
    p.status = "paid"
    p.paid_at = datetime.now()
    db.commit()
    db.refresh(p)
    return p


@router.get("/payroll/summary")
def payroll_summary(
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Payroll), Payroll, db, current_user)
    total_gross = db.query(func.sum(Payroll.gross_salary)).filter(
        Payroll.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).scalar() or 0
    total_net = db.query(func.sum(Payroll.net_salary)).filter(
        Payroll.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).scalar() or 0
    paid = q.filter(Payroll.status == "paid").count()
    pending = q.filter(Payroll.status == "draft").count()
    return {
        "total_gross": round(total_gross, 2),
        "total_net": round(total_net, 2),
        "paid_count": paid,
        "pending_count": pending,
    }


# ─── DEDUCTIONS ─────────────────────────────────────────────

@router.get("/deductions")
def list_deductions(
    employee_id: str = "", deduction_type: str = "",
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Deduction), Deduction, db, current_user)
    if employee_id:
        q = q.filter(Deduction.employee_id == employee_id)
    if deduction_type:
        q = q.filter(Deduction.deduction_type == deduction_type)
    return q.order_by(Deduction.name).all()


@router.post("/deductions", status_code=201)
def create_deduction(
    req: DeductionCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    d = Deduction(**req.model_dump(), tenant_id=getattr(current_user, "tenant_id", "default"))
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.put("/deductions/{deduction_id}")
def update_deduction(
    deduction_id: str, req: DeductionUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    d = db.query(Deduction).filter(
        Deduction.id == deduction_id,
        Deduction.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not d:
        raise HTTPException(404, "Descuento no encontrado")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(d, field, val)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/deductions/{deduction_id}")
def delete_deduction(
    deduction_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    d = db.query(Deduction).filter(
        Deduction.id == deduction_id,
        Deduction.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not d:
        raise HTTPException(404, "Descuento no encontrado")
    db.delete(d)
    db.commit()
    return {"message": "Descuento eliminado"}


# ─── PERFORMANCE EVALUATIONS ───────────────────────────────

@router.get("/evaluations")
def list_evaluations(
    employee_id: str = "", status: str = "",
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(PerformanceEvaluation), PerformanceEvaluation, db, current_user)
    if employee_id:
        q = q.filter(PerformanceEvaluation.employee_id == employee_id)
    if status:
        q = q.filter(PerformanceEvaluation.status == status)
    return q.order_by(PerformanceEvaluation.evaluation_date.desc()).all()


@router.post("/evaluations", status_code=201)
def create_evaluation(
    req: EvaluationCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    ev = PerformanceEvaluation(
        **req.model_dump(), tenant_id=getattr(current_user, "tenant_id", "default"),
    )
    ev.evaluation_date = date.fromisoformat(req.evaluation_date)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.put("/evaluations/{evaluation_id}")
def update_evaluation(
    evaluation_id: str, req: EvaluationUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    ev = db.query(PerformanceEvaluation).filter(
        PerformanceEvaluation.id == evaluation_id,
        PerformanceEvaluation.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not ev:
        raise HTTPException(404, "Evaluación no encontrada")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(ev, field, val)
    db.commit()
    db.refresh(ev)
    return ev


# ─── SURVEYS ────────────────────────────────────────────────

@router.get("/surveys")
def list_surveys(
    status: str = "", db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(Survey), Survey, db, current_user)
    if status:
        q = q.filter(Survey.status == status)
    return q.order_by(Survey.created_at.desc()).all()


@router.post("/surveys", status_code=201)
def create_survey(
    req: SurveyCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    s = Survey(**req.model_dump(), created_by=current_user.id,
               tenant_id=getattr(current_user, "tenant_id", "default"))
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.put("/surveys/{survey_id}")
def update_survey(
    survey_id: str, req: SurveyUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    s = db.query(Survey).filter(
        Survey.id == survey_id,
        Survey.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not s:
        raise HTTPException(404, "Encuesta no encontrada")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(s, field, val)
    db.commit()
    db.refresh(s)
    return s


@router.post("/surveys/{survey_id}/respond")
def respond_survey(
    survey_id: str, req: SurveyAnswerCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "employee")),
):
    sr = SurveyResponse(
        survey_id=survey_id, employee_id=req.employee_id,
        answers=req.answers, tenant_id=getattr(current_user, "tenant_id", "default"),
    )
    db.add(sr)
    db.commit()
    return {"message": "Respuesta registrada"}


# ─── FILE HELPERS ────────────────────────────────────────────

import os, uuid as uuid_mod

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "ats")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXT = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".gif", ".webp"}

def extract_text_from_file(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()
    text = ""
    try:
        if ext == ".pdf":
            import pdfplumber
            with pdfplumber.open(filepath) as pdf:
                text = "\n".join(p.page_text or "" for p in pdf.pages)
        elif ext in (".doc", ".docx"):
            from docx import Document
            doc = Document(filepath)
            text = "\n".join(p.text for p in doc.paragraphs)
        elif ext in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
            text = f"[Imagen: {os.path.basename(filepath)} - se analizará con IA]"
        else:
            text = ""
    except Exception as e:
        text = f"[Error al leer {os.path.basename(filepath)}: {e}]"
    return text.strip()

# ─── ATS ────────────────────────────────────────────────────

@router.get("/ats/positions")
def list_ats_positions(
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    tid = getattr(current_user, "tenant_id", "default")
    positions = db.query(HRPosition.name).filter(
        HRPosition.tenant_id == tid,
    ).order_by(HRPosition.name).all()
    return [r[0] for r in positions if r[0]]

@router.post("/ats/upload", status_code=200)
def upload_ats_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Tipo de archivo no permitido: {ext}. Permitidos: {', '.join(sorted(ALLOWED_EXT))}")
    uid = str(uuid_mod.uuid4())[:8]
    fname = f"{uid}_{file.filename}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as f:
        import shutil
        shutil.copyfileobj(file.file, f)
    return {"filename": fname, "path": f"/uploads/ats/{fname}"}

@router.get("/ats")
def list_ats_candidates(
    status: str = "", classification: str = "",
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    q = tenant_filter(db.query(ATSCandidate), ATSCandidate, db, current_user)
    if status:
        q = q.filter(ATSCandidate.status == status)
    if classification:
        q = q.filter(ATSCandidate.classification == classification)
    return q.order_by(ATSCandidate.score.desc()).all()


@router.post("/ats", status_code=201)
def create_ats_candidate(
    req: ATSCandidateCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    c = ATSCandidate(**req.model_dump(), tenant_id=getattr(current_user, "tenant_id", "default"))
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/ats/{candidate_id}")
def update_ats_candidate(
    candidate_id: str, req: ATSCandidateUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    c = db.query(ATSCandidate).filter(
        ATSCandidate.id == candidate_id,
        ATSCandidate.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not c:
        raise HTTPException(404, "Candidato no encontrado")
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(c, field, val)
    db.commit()
    db.refresh(c)
    return c


@router.post("/ats/{candidate_id}/analyze")
def analyze_candidate_ai(
    candidate_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    c = db.query(ATSCandidate).filter(
        ATSCandidate.id == candidate_id,
        ATSCandidate.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not c:
        raise HTTPException(404, "Candidato no encontrado")
    import os, json
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        c.classification = "pending"
        c.score = 0
        c.ai_analysis = {"error": "OpenAI no configurado"}
        db.commit()
        return c
    try:
        resume_text = c.resume_text or ""
        descr_text = ""
        if c.resume_file and os.path.exists(os.path.join(UPLOAD_DIR, c.resume_file)):
            fpath = os.path.join(UPLOAD_DIR, c.resume_file)
            file_text = extract_text_from_file(fpath)
            if file_text:
                resume_text += "\n" + file_text
        if c.position_descr_file and os.path.exists(os.path.join(UPLOAD_DIR, c.position_descr_file)):
            dpath = os.path.join(UPLOAD_DIR, c.position_descr_file)
            descr_text = extract_text_from_file(dpath)
        if not resume_text.strip():
            resume_text = f"Candidato: {c.name}. Puesto: {c.position_applied}"
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        messages = [{"role": "system", "content": "Eres un reclutador experto que analiza perfiles contra descripciones de puesto."}]
        user_content = f"Perfil del candidato:\n{resume_text.strip()}\n\nPuesto aplicado: {c.position_applied}"
        if descr_text:
            user_content += f"\n\nDescripción del puesto:\n{descr_text.strip()}"
        user_content += """
Clasifica al candidato en una de estas categorías:
- sobre-calificado
- calificado
- medianamente-calificado
- subcalificado
- no-calificado

Responde solo con JSON:
{"classification": "categoria", "score": 0-100, "strengths": "fortalezas", "weaknesses": "debilidades", "recommendations": "próximos pasos"}"""
        messages.append({"role": "user", "content": user_content})
        resp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), messages=messages,
            response_format={"type": "json_object"},
        )
        result = json.loads(resp.choices[0].message.content)
        c.classification = result.get("classification", "pending")
        c.score = result.get("score", 0)
        c.strengths = result.get("strengths", "")
        c.weaknesses = result.get("weaknesses", "")
        c.recommendations = result.get("recommendations", "")
        c.ai_analysis = result
        c.evaluated_by = f"AI ({os.getenv('OPENAI_MODEL', 'gpt-4o-mini')})"
        c.status = "reviewing"
        db.commit()
        db.refresh(c)
    except Exception as e:
        c.ai_analysis = {"error": str(e)}
        db.commit()
    return c


# ─── POSITIONS ──────────────────────────────────────────────

@router.get("/positions", response_model=list[PositionResponse])
def list_positions(
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    tid = getattr(current_user, "tenant_id", "default")
    return db.query(HRPosition).filter(HRPosition.tenant_id == tid).order_by(HRPosition.name).all()


@router.post("/positions", status_code=201, response_model=PositionResponse)
def create_position(
    name: str = Form(...), db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    p = HRPosition(name=name, tenant_id=getattr(current_user, "tenant_id", "default"))
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/positions/{position_id}", response_model=PositionResponse)
def update_position(
    position_id: str, name: str = Form(...), db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    p = db.query(HRPosition).filter(
        HRPosition.id == position_id,
        HRPosition.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not p:
        raise HTTPException(404, "Posición no encontrada")
    p.name = name
    db.commit()
    db.refresh(p)
    return p


@router.delete("/positions/{position_id}")
def delete_position(
    position_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    p = db.query(HRPosition).filter(
        HRPosition.id == position_id,
        HRPosition.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not p:
        raise HTTPException(404, "Posición no encontrada")
    db.delete(p)
    db.commit()
    return {"message": "Posición eliminada"}


@router.post("/positions/{position_id}/upload-descr", status_code=200)
def upload_position_descr(
    position_id: str, file: UploadFile = File(...), db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    p = db.query(HRPosition).filter(
        HRPosition.id == position_id,
        HRPosition.tenant_id == getattr(current_user, "tenant_id", "default"),
    ).first()
    if not p:
        raise HTTPException(404, "Posición no encontrada")
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Tipo de archivo no permitido: {ext}")
    uid = str(uuid_mod.uuid4())[:8]
    fname = f"{uid}_{file.filename}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as f:
        import shutil
        shutil.copyfileobj(file.file, f)
    p.description_file = fname
    db.commit()
    db.refresh(p)
    return {"filename": fname}


# ─── DASHBOARD ──────────────────────────────────────────────

@router.get("/dashboard")
def hr_dashboard(
    db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "manager")),
):
    tid = getattr(current_user, "tenant_id", "default")
    emp_q = db.query(Employee).filter(Employee.tenant_id == tid)
    total_emp = emp_q.count()
    active_emp = emp_q.filter(Employee.status == "active").count()
    payroll_total = db.query(func.sum(Payroll.net_salary)).filter(
        Payroll.tenant_id == tid, Payroll.status == "paid",
    ).scalar() or 0
    pending_vac = db.query(Vacation).filter(
        Vacation.tenant_id == tid, Vacation.status == "pending",
    ).count()
    today_absent = db.query(Attendance).filter(
        Attendance.tenant_id == tid,
        Attendance.date == date.today(),
        Attendance.status == "absent",
    ).count()
    evals_pending = db.query(PerformanceEvaluation).filter(
        PerformanceEvaluation.tenant_id == tid,
        PerformanceEvaluation.status == "draft",
    ).count()
    return {
        "total_employees": total_emp,
        "active_employees": active_emp,
        "total_payroll": round(payroll_total, 2),
        "pending_vacations": pending_vac,
        "today_absent": today_absent,
        "pending_evaluations": evals_pending,
    }
