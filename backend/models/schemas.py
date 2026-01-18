"""
Pydantic schemas for API request/response models
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class OptimizationRequest(BaseModel):
    """Request model for optimization endpoint."""
    
    initial_capital: float = Field(
        default=1000000,
        ge=1000,
        le=100000000,
        description="Initial capital/wealth (K_0)"
    )
    annual_return: float = Field(
        default=0.05,
        ge=0.001,
        le=0.30,
        description="Annual return rate (r)"
    )
    discount_rate: float = Field(
        default=0.03,
        ge=0.001,
        le=0.20,
        description="Time preference/discount rate (ρ)"
    )
    risk_aversion: float = Field(
        default=2.0,
        ge=0.1,
        le=10.0,
        description="CRRA risk aversion coefficient (σ)"
    )
    life_expectancy: int = Field(
        default=85,
        ge=50,
        le=120,
        description="Expected lifespan (T)"
    )
    current_age: int = Field(
        default=35,
        ge=18,
        le=100,
        description="Current age (t_0)"
    )
    inheritance_target: float = Field(
        default=200000,
        ge=0,
        le=100000000,
        description="Target bequest/inheritance (K_T)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "initial_capital": 1000000,
                "annual_return": 0.05,
                "discount_rate": 0.03,
                "risk_aversion": 2.0,
                "life_expectancy": 85,
                "current_age": 35,
                "inheritance_target": 200000
            }
        }


class PeriodData(BaseModel):
    """Single period data in the optimization series."""
    
    period: int = Field(description="Period number (0 to T)")
    age: int = Field(description="Age at this period")
    capital: float = Field(description="Capital at start of period (K_t)")
    consumption: float = Field(description="Optimal consumption (C_t)")
    utility: float = Field(description="Period utility U(C_t)")
    savings: float = Field(description="Savings (K_t - C_t)")


class OptimizationResponse(BaseModel):
    """Response model for optimization endpoint."""
    
    initial_consumption: float = Field(description="Optimal initial consumption (C_1)")
    total_utility: float = Field(description="Total discounted lifetime utility")
    final_capital: float = Field(description="Final capital at period T")
    horizon: int = Field(description="Planning horizon in years")
    beta: float = Field(description="Discount factor β = 1/(1+ρ)")
    growth_rate: float = Field(description="Consumption growth rate per period")
    series: List[PeriodData] = Field(description="Time series of capital and consumption")
    
    # Summary statistics
    avg_consumption: Optional[float] = Field(default=None, description="Average consumption")
    max_consumption: Optional[float] = Field(default=None, description="Maximum consumption")
    min_consumption: Optional[float] = Field(default=None, description="Minimum consumption")

    class Config:
        json_schema_extra = {
            "example": {
                "initial_consumption": 45234.67,
                "total_utility": -0.0123,
                "final_capital": 200000,
                "horizon": 50,
                "beta": 0.9709,
                "growth_rate": 1.0098,
                "series": [
                    {
                        "period": 0,
                        "age": 35,
                        "capital": 1000000,
                        "consumption": 45234.67,
                        "utility": -0.000022,
                        "savings": 954765.33
                    }
                ],
                "avg_consumption": 52345.89,
                "max_consumption": 67890.12,
                "min_consumption": 45234.67
            }
        }


class EstimatorCreate(BaseModel):
    """Schema for creating a new estimator configuration."""
    
    name: Optional[str] = Field(default=None, max_length=100)
    initial_capital: float
    annual_return: float = 0.05
    discount_rate: float = 0.03
    risk_aversion: float = 2.0
    life_expectancy: int = 85
    current_age: int
    inheritance_target: float = 0


class EstimatorResponse(BaseModel):
    """Schema for estimator response."""
    
    id: str
    user_id: str
    name: Optional[str]
    initial_capital: float
    annual_return: float
    discount_rate: float
    risk_aversion: float
    life_expectancy: int
    current_age: int
    inheritance_target: float
    created_at: str
    updated_at: str


class HealthResponse(BaseModel):
    """Health check response."""
    
    status: str
    version: str
    service: str
