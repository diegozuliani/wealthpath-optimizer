"""
Health check endpoint
"""

from fastapi import APIRouter
from models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    """
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        service="wealthpath-optimizer"
    )
