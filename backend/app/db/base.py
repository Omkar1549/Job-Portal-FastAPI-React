from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.

    All models should inherit from this Base so that
    Base.metadata.create_all(engine) can create all tables at once.

    Usage:
        from app.db.base import Base

        class MyModel(Base):
            __tablename__ = "my_table"
            ...
    """
    pass


# ── Import all models here so Alembic can detect them ─
# This file is imported by alembic/env.py so that autogenerate
# can see all table definitions.
from app.models.user import User            # noqa: F401, E402
from app.models.job import Job              # noqa: F401, E402
from app.models.application import Application  # noqa: F401, E402