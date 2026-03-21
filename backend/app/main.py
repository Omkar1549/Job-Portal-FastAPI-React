import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

from app.api.auth import router as auth_router
from app.api.jobs import router as jobs_router
from app.api.applicants import router as applicants_router

# ── Create DB tables ──────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Create uploads directory ──────────────────────────
os.makedirs(settings.UPLOADS_DIR, exist_ok=True)

# ── FastAPI app ───────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ───────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Manual CORS headers (extra safety net) ────────────
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# ── Static files ──────────────────────────────────────
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOADS_DIR),
    name="uploads",
)

# ── Routers ───────────────────────────────────────────
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(applicants_router)

# ── Health check ──────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
