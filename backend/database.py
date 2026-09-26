from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "showroom-secret-key-change-me"
    algorithm: str = "HS256"
    access_token_expire_hours: int = 72
    # Local dev defaults to SQLite. In production (Render/Railway/etc.) set
    # DATABASE_URL to a Postgres connection string, e.g.:
    # postgresql://user:password@host:5432/dbname
    database_url: str = "sqlite:///./showroom.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000,https://newjeddahmotors.vercel.app"

    # SMTP — used to email OTP codes for admin signup verification.
    # If smtp_host is left blank, OTPs are printed to the server console
    # instead (handy for local dev without a real mailbox).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    from_email: str = "New Jeddah Motors <no-reply@newjeddahmotors.com>"
    otp_expire_minutes: int = 10

    class Config:
        env_file = ".env"


settings = Settings()

is_sqlite = settings.database_url.startswith("sqlite")

# Some managed Postgres providers (Render, Supabase, Railway) hand out
# "postgres://" URLs — SQLAlchemy 2.x needs "postgresql://".
db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
