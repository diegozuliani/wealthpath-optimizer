"""
WealthPath Optimizer API - FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import optimization, health

app = FastAPI(
    title="WealthPath Optimizer API",
    description="Financial optimization API using Bellman model and Euler equation",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(optimization.router, prefix="/api/v1", tags=["Optimization"])


@app.get("/")
async def root():
    return {
        "name": "WealthPath Optimizer API",
        "version": "0.1.0",
        "docs": "/docs",
    }
