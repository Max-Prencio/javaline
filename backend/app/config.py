import os

# PostgreSQL — Railway/Supabase/Render provide DATABASE_URL automatically
_raw_db_url = os.getenv("DATABASE_URL", "postgresql://postgres@localhost:5432/javaline")
# SQLAlchemy 2.0 requires postgresql://, not postgres://
DATABASE_URL = _raw_db_url.replace("postgres://", "postgresql://", 1)

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-javaline-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# CORS — comma-separated list in env var, falls back to localhost dev origins
_cors_env = os.getenv("CORS_ORIGINS", "")
if _cors_env:
    CORS_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    # Development defaults — production MUST set CORS_ORIGINS
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:5174",
        "http://localhost",
    ]
