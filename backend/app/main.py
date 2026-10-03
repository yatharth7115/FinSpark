"""ASGI entry point: uvicorn app.main:app --port 8001."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db
from app.db import models  # Register all model metadata before creating tables.
from app.api.auth import router as auth_router
from app.api.routes import router


@asynccontextmanager
async def lifespan(app):
    init_db()
    yield


app = FastAPI(
    title="FinSpark Integration Workbench", version="0.2.0", lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth_router)
app.include_router(router)


@app.get("/health", tags=["health"])
def health():
    return {
        "status": "healthy",
        "service": "FinSpark",
        "simulation_only": True,
        "demo_mode": settings.demo_mode,
    }
