"""
Context One Backend API
FastAPI application for unified AI memory
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.routers import auth, projects, conversations, context, billing

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Context One API starting up...")
    yield
    # Shutdown
    print("Context One API shutting down...")

app = FastAPI(
    title="Context One API",
    description="Unified AI memory across all your tools",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://contextone.vercel.app", "https://contextone.space"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(context.router, prefix="/api/v1/context", tags=["context"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["billing"])

@app.get("/")
async def root():
    return {"message": "Context One API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}