import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime, timedelta, timezone

from ..database import get_db
from ..config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from ..middleware import require_role
from ..models.user import User
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from ..schemas.user import ChangePasswordRequest, ChangePasswordAdminRequest, InviteRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def create_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email, User.status == "active").first()
    if not user or not _bcrypt.checkpw(req.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_token(user)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    )


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    user = User(
        name=req.name,
        email=req.email,
        password_hash=_bcrypt.hashpw(req.password.encode(), _bcrypt.gensalt()).decode(),
        role="employee",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    )


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest, db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == req.id, User.status == "active").first()
    if not user or not _bcrypt.checkpw(req.current_password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")
    user.password_hash = _bcrypt.hashpw(req.new_password.encode(), _bcrypt.gensalt()).decode()
    db.commit()
    return {"message": "Contraseña actualizada"}


@router.post("/change-password-admin")
def change_password_admin(
    req: ChangePasswordAdminRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")
    user = db.query(User).filter(User.id == req.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.password_hash = _bcrypt.hashpw(req.new_password.encode(), _bcrypt.gensalt()).decode()
    db.commit()
    return {"message": "Contraseña actualizada por administrador"}


@router.post("/invite")
def send_invitation(
    req: InviteRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    import uuid
    invited_user = User(
        name=req.email.split("@")[0],
        email=req.email,
        password_hash=_bcrypt.hashpw(b"temporal123", _bcrypt.gensalt()).decode(),
        role="employee",
        status="invited",
    )
    db.add(invited_user)
    db.commit()
    db.refresh(invited_user)
    return {"message": f"Invitación enviada a {req.email}", "user_id": invited_user.id}


@router.get("/invitations")
def list_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return db.query(User).filter(User.status == "invited").all()


@router.post("/accept-invitation")
def accept_invitation(
    req: dict, db: Session = Depends(get_db),
):
    code = req.get("code")
    name = req.get("name", "")
    password = req.get("password", "")
    if not code or not password:
        raise HTTPException(status_code=400, detail="Código y contraseña requeridos")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    user = db.query(User).filter(User.id == code, User.status == "invited").first()
    if not user:
        raise HTTPException(status_code=404, detail="Invitación no encontrada o ya usada")
    user.name = name or user.name
    user.password_hash = _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()
    user.status = "active"
    db.commit()
    token = create_token(user)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    )


@router.post("/invitations/{invitation_id}/resend")
def resend_invitation(
    invitation_id: str, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == invitation_id, User.status == "invited").first()
    if not user:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    return {"message": f"Invitación reenviada a {user.email}"}
