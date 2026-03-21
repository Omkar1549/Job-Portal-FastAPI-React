from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# ── Engine ────────────────────────────────────────────
# connect_args is only needed for SQLite (not thread-safe by default)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    # Pool settings for PostgreSQL — ignored by SQLite
    pool_pre_ping=True,       # Detects broken connections
    pool_recycle=3600,        # Recycle connections after 1 hour
)

# ── Session Factory ───────────────────────────────────
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ── Dependency ────────────────────────────────────────
def get_db():
    """
    FastAPI dependency that yields a DB session per request.
    Always closes the session on completion (success or error).

    Usage in route:
        def my_route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()