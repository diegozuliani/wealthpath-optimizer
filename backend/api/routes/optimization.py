"""
Optimization API endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import List

from models.schemas import (
    OptimizationRequest,
    OptimizationResponse,
    PeriodData,
)
from core.optimizer import compute_optimization, OptimizationParams, BellmanOptimizer

router = APIRouter()


@router.post("/optimize", response_model=OptimizationResponse)
async def run_optimization(request: OptimizationRequest):
    """
    Run the consumption optimization model.
    
    Computes the optimal consumption path using:
    - Bellman equation for dynamic programming
    - Euler equation for consumption smoothing
    - Transversality condition for bequest motive
    
    Returns the complete time series of capital and consumption evolution.
    """
    try:
        # Validate life expectancy > current age
        if request.life_expectancy <= request.current_age:
            raise HTTPException(
                status_code=400,
                detail="Life expectancy must be greater than current age"
            )
        
        # Run optimization
        result = compute_optimization(
            initial_capital=request.initial_capital,
            annual_return=request.annual_return,
            discount_rate=request.discount_rate,
            risk_aversion=request.risk_aversion,
            life_expectancy=request.life_expectancy,
            current_age=request.current_age,
            inheritance_target=request.inheritance_target,
        )
        
        # Convert series to response format
        series_data = [
            PeriodData(
                period=p.period,
                age=p.age,
                capital=round(p.capital, 2),
                consumption=round(p.consumption, 2),
                utility=p.utility,
                savings=round(p.savings, 2),
            )
            for p in result.series
        ]
        
        # Calculate summary statistics
        consumptions = [p.consumption for p in result.series]
        
        return OptimizationResponse(
            initial_consumption=round(result.initial_consumption, 2),
            total_utility=result.total_utility,
            final_capital=round(result.final_capital, 2),
            horizon=result.horizon,
            beta=round(result.beta, 6),
            growth_rate=round(result.growth_rate, 6),
            series=series_data,
            avg_consumption=round(sum(consumptions) / len(consumptions), 2),
            max_consumption=round(max(consumptions), 2),
            min_consumption=round(min(consumptions), 2),
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(e)}"
        )


@router.post("/optimize/preview")
async def preview_optimization(request: OptimizationRequest):
    """
    Quick preview of optimization without full series.
    Returns only key metrics for faster response during slider adjustments.
    """
    try:
        if request.life_expectancy <= request.current_age:
            raise HTTPException(
                status_code=400,
                detail="Life expectancy must be greater than current age"
            )
        
        # Create optimizer for quick calculations
        params = OptimizationParams(
            initial_capital=request.initial_capital,
            annual_return=request.annual_return,
            discount_rate=request.discount_rate,
            risk_aversion=request.risk_aversion,
            life_expectancy=request.life_expectancy,
            current_age=request.current_age,
            inheritance_target=request.inheritance_target,
        )
        
        optimizer = BellmanOptimizer(params)
        c1 = optimizer.find_optimal_c1()
        
        return {
            "initial_consumption": round(c1, 2),
            "beta": round(optimizer.beta, 6),
            "growth_rate": round(optimizer.growth_rate, 6),
            "horizon": optimizer.T,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/parameters/defaults")
async def get_default_parameters():
    """
    Get default parameter values for the optimization model.
    """
    return {
        "initial_capital": {
            "default": 1000000,
            "min": 1000,
            "max": 100000000,
            "step": 10000,
            "description": "Initial capital/wealth (K₀)"
        },
        "annual_return": {
            "default": 0.05,
            "min": 0.001,
            "max": 0.30,
            "step": 0.005,
            "description": "Annual return rate (r)"
        },
        "discount_rate": {
            "default": 0.03,
            "min": 0.001,
            "max": 0.20,
            "step": 0.005,
            "description": "Time preference rate (ρ)"
        },
        "risk_aversion": {
            "default": 2.0,
            "min": 0.1,
            "max": 10.0,
            "step": 0.1,
            "description": "CRRA risk aversion coefficient (σ)"
        },
        "life_expectancy": {
            "default": 85,
            "min": 50,
            "max": 120,
            "step": 1,
            "description": "Expected lifespan (T)"
        },
        "current_age": {
            "default": 35,
            "min": 18,
            "max": 100,
            "step": 1,
            "description": "Current age (t₀)"
        },
        "inheritance_target": {
            "default": 200000,
            "min": 0,
            "max": 100000000,
            "step": 10000,
            "description": "Target bequest (K_T)"
        }
    }
