import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres@localhost:5432/javaline"
)

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-javaline-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
