"""
WealthPath Optimizer - Core Financial Engine

Implementation of the Bellman Model and Euler Equation for
optimal consumption path calculation with transversality condition.

Mathematical Foundation:
- Bellman Equation: V(K, t) = max{U(C) + β * E[V(K', t+1)]}
- Euler Equation: U'(Ct) = β(1+r) * E[U'(Ct+1)]
- For CRRA utility: Ct+1/Ct = [β(1+r)]^(1/σ)
- State Transition: K_{t+1} = (1+r)(K_t - C_t)
- Transversality: K_T = K_target (inheritance)
"""

import numpy as np
from scipy.optimize import brentq
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class OptimizationParams:
    """Parameters for the consumption optimization model."""
    initial_capital: float      # K_0: Initial wealth
    annual_return: float        # r: Annual return rate
    discount_rate: float        # ρ (rho): Time preference rate
    risk_aversion: float        # σ (sigma): CRRA risk aversion coefficient
    life_expectancy: int        # T: Expected lifespan
    current_age: int            # t_0: Current age
    inheritance_target: float   # K_T: Target final capital (bequest)


@dataclass
class PeriodResult:
    """Results for a single period in the optimization."""
    period: int
    age: int
    capital: float
    consumption: float
    utility: float
    savings: float


@dataclass
class OptimizationResult:
    """Complete optimization results."""
    initial_consumption: float      # C_1: Optimal initial consumption
    total_utility: float            # Sum of discounted utilities
    final_capital: float            # K_T: Actual final capital
    horizon: int                    # T: Number of periods
    beta: float                     # β = 1/(1+ρ): Discount factor
    growth_rate: float              # [β(1+r)]^(1/σ): Consumption growth
    series: List[PeriodResult]      # Time series of results


class BellmanOptimizer:
    """
    Optimizer using backward induction (Bellman) and Euler equation.
    
    Solves for the optimal consumption path C_1, C_2, ..., C_T subject to:
    1. Budget constraint: K_{t+1} = (1+r)(K_t - C_t)
    2. Euler equation: C_{t+1} = C_t * [β(1+r)]^(1/σ)
    3. Transversality: K_T = K_target
    """
    
    def __init__(self, params: OptimizationParams):
        self.params = params
        self.T = params.life_expectancy - params.current_age
        
        # Calculate discount factor β = 1/(1+ρ)
        self.beta = 1 / (1 + params.discount_rate)
        
        # Calculate consumption growth rate from Euler equation
        # C_{t+1}/C_t = [β(1+r)]^(1/σ)
        self.growth_rate = np.power(
            self.beta * (1 + params.annual_return),
            1 / params.risk_aversion
        )
    
    def crra_utility(self, consumption: float) -> float:
        """
        CRRA (Constant Relative Risk Aversion) utility function.
        
        U(C) = C^(1-σ) / (1-σ)  if σ ≠ 1
        U(C) = ln(C)            if σ = 1 (log utility)
        """
        sigma = self.params.risk_aversion
        
        if consumption <= 0:
            return -np.inf
        
        if np.isclose(sigma, 1.0):
            return np.log(consumption)
        else:
            return np.power(consumption, 1 - sigma) / (1 - sigma)
    
    def simulate_path(self, initial_consumption: float) -> tuple[float, List[PeriodResult]]:
        """
        Simulate the consumption and capital path given initial consumption.
        
        Returns:
            Tuple of (final_capital, series)
        """
        K = self.params.initial_capital
        C = initial_consumption
        r = self.params.annual_return
        
        series = []
        
        for t in range(self.T + 1):
            # Ensure consumption doesn't exceed capital
            actual_consumption = min(C, K * 0.99) if K > 0 else 0
            
            # Calculate utility
            utility = self.crra_utility(actual_consumption)
            
            # Store period result
            series.append(PeriodResult(
                period=t,
                age=self.params.current_age + t,
                capital=K,
                consumption=actual_consumption,
                utility=utility,
                savings=K - actual_consumption if K > actual_consumption else 0
            ))
            
            # State transition: K_{t+1} = (1+r)(K_t - C_t)
            if t < self.T:
                K = (K - actual_consumption) * (1 + r)
                K = max(K, 0)  # Capital cannot go negative
                
                # Apply Euler equation for next period consumption
                C = actual_consumption * self.growth_rate
        
        return K, series
    
    def find_optimal_c1(self) -> float:
        """
        Find optimal initial consumption C_1 using the transversality condition.
        
        Solves: Find C_1 such that K_T = K_target (inheritance target)
        
        Uses Brent's method for root finding within bounds.
        """
        K0 = self.params.initial_capital
        K_target = self.params.inheritance_target
        
        def objective(c1: float) -> float:
            """Objective function: difference between final capital and target."""
            final_capital, _ = self.simulate_path(c1)
            return final_capital - K_target
        
        # Set bounds for initial consumption
        # Lower bound: very small consumption (results in high final capital)
        # Upper bound: consuming almost all (results in low final capital)
        c1_min = K0 * 0.001  # 0.1% of initial capital
        c1_max = K0 * 0.50   # 50% of initial capital
        
        # Check if solution exists within bounds
        try:
            f_min = objective(c1_min)
            f_max = objective(c1_max)
            
            # If signs are the same, adjust bounds
            if f_min * f_max > 0:
                if f_min > 0 and f_max > 0:
                    # Both result in too much final capital
                    # Need to consume more - find upper bound
                    for mult in [0.6, 0.7, 0.8, 0.9]:
                        c1_max = K0 * mult
                        if objective(c1_max) < 0:
                            break
                else:
                    # Both result in too little final capital
                    # Need to consume less
                    c1_min = K0 * 0.0001
            
            # Find the root
            c1_optimal = brentq(objective, c1_min, c1_max, xtol=1e-8, maxiter=100)
            
        except ValueError:
            # If Brent's method fails, use a simple iterative approach
            c1_optimal = self._iterative_solver()
        
        return c1_optimal
    
    def _iterative_solver(self, max_iter: int = 100) -> float:
        """
        Fallback iterative solver using binary search.
        """
        K0 = self.params.initial_capital
        K_target = self.params.inheritance_target
        
        low = K0 * 0.001
        high = K0 * 0.9
        
        for _ in range(max_iter):
            mid = (low + high) / 2
            final_K, _ = self.simulate_path(mid)
            
            if abs(final_K - K_target) < 1:  # Within $1
                return mid
            
            if final_K > K_target:
                low = mid  # Consume more
            else:
                high = mid  # Consume less
        
        return mid
    
    def optimize(self) -> OptimizationResult:
        """
        Run the full optimization and return complete results.
        """
        # Find optimal initial consumption
        c1_optimal = self.find_optimal_c1()
        
        # Simulate the optimal path
        final_capital, series = self.simulate_path(c1_optimal)
        
        # Calculate total discounted utility
        total_utility = sum(
            np.power(self.beta, p.period) * p.utility
            for p in series
            if not np.isinf(p.utility)
        )
        
        return OptimizationResult(
            initial_consumption=c1_optimal,
            total_utility=total_utility,
            final_capital=final_capital,
            horizon=self.T,
            beta=self.beta,
            growth_rate=self.growth_rate,
            series=series
        )


def compute_optimization(
    initial_capital: float = 1000000,
    annual_return: float = 0.05,
    discount_rate: float = 0.03,
    risk_aversion: float = 2.0,
    life_expectancy: int = 85,
    current_age: int = 35,
    inheritance_target: float = 200000
) -> OptimizationResult:
    """
    Convenience function to run optimization with given parameters.
    
    Args:
        initial_capital: Initial wealth (K_0)
        annual_return: Annual return rate (r)
        discount_rate: Time preference rate (ρ)
        risk_aversion: CRRA coefficient (σ)
        life_expectancy: Expected lifespan (T)
        current_age: Current age (t_0)
        inheritance_target: Target bequest (K_T)
    
    Returns:
        OptimizationResult with complete time series
    """
    params = OptimizationParams(
        initial_capital=initial_capital,
        annual_return=annual_return,
        discount_rate=discount_rate,
        risk_aversion=risk_aversion,
        life_expectancy=life_expectancy,
        current_age=current_age,
        inheritance_target=inheritance_target
    )
    
    optimizer = BellmanOptimizer(params)
    return optimizer.optimize()


# Example usage
if __name__ == "__main__":
    result = compute_optimization()
    
    print(f"Optimal Initial Consumption: ${result.initial_consumption:,.2f}")
    print(f"Consumption Growth Rate: {result.growth_rate:.4f} ({(result.growth_rate - 1) * 100:.2f}% per year)")
    print(f"Final Capital: ${result.final_capital:,.2f}")
    print(f"Total Utility: {result.total_utility:,.4f}")
    print(f"\nFirst 5 periods:")
    for p in result.series[:5]:
        print(f"  Year {p.period}: K=${p.capital:,.0f}, C=${p.consumption:,.0f}")
