"""
Tests for the optimization engine
"""

import pytest
from core.optimizer import (
    BellmanOptimizer,
    OptimizationParams,
    compute_optimization,
)


@pytest.fixture
def default_params():
    return OptimizationParams(
        initial_capital=1000000,
        annual_return=0.05,
        discount_rate=0.03,
        risk_aversion=2.0,
        life_expectancy=85,
        current_age=35,
        inheritance_target=200000,
    )


class TestBellmanOptimizer:
    def test_creates_optimizer(self, default_params):
        """Test optimizer creation with valid parameters."""
        optimizer = BellmanOptimizer(default_params)
        assert optimizer.T == 50  # 85 - 35
        assert optimizer.beta < 1
        assert optimizer.growth_rate > 0

    def test_beta_calculation(self, default_params):
        """Test discount factor calculation: β = 1/(1+ρ)"""
        optimizer = BellmanOptimizer(default_params)
        expected_beta = 1 / (1 + 0.03)
        assert abs(optimizer.beta - expected_beta) < 1e-10

    def test_growth_rate_positive(self, default_params):
        """Test that consumption growth rate is positive."""
        optimizer = BellmanOptimizer(default_params)
        assert optimizer.growth_rate > 0

    def test_crra_utility_positive_consumption(self, default_params):
        """Test CRRA utility with positive consumption."""
        optimizer = BellmanOptimizer(default_params)
        utility = optimizer.crra_utility(50000)
        assert utility != float('-inf')
        assert not pytest.approx(utility, nan_ok=False) != utility

    def test_crra_utility_zero_consumption(self, default_params):
        """Test CRRA utility with zero consumption returns -inf."""
        optimizer = BellmanOptimizer(default_params)
        utility = optimizer.crra_utility(0)
        assert utility == float('-inf')

    def test_simulate_path_length(self, default_params):
        """Test that simulation produces correct number of periods."""
        optimizer = BellmanOptimizer(default_params)
        _, series = optimizer.simulate_path(50000)
        assert len(series) == optimizer.T + 1

    def test_optimize_finds_solution(self, default_params):
        """Test that optimization finds a valid solution."""
        result = compute_optimization(
            initial_capital=default_params.initial_capital,
            annual_return=default_params.annual_return,
            discount_rate=default_params.discount_rate,
            risk_aversion=default_params.risk_aversion,
            life_expectancy=default_params.life_expectancy,
            current_age=default_params.current_age,
            inheritance_target=default_params.inheritance_target,
        )
        
        assert result.initial_consumption > 0
        assert result.series is not None
        assert len(result.series) > 0

    def test_transversality_condition(self, default_params):
        """Test that final capital approximately equals inheritance target."""
        result = compute_optimization(
            initial_capital=default_params.initial_capital,
            annual_return=default_params.annual_return,
            discount_rate=default_params.discount_rate,
            risk_aversion=default_params.risk_aversion,
            life_expectancy=default_params.life_expectancy,
            current_age=default_params.current_age,
            inheritance_target=default_params.inheritance_target,
        )
        
        # Allow for numerical precision error
        tolerance = abs(default_params.inheritance_target * 0.01) + 100
        assert abs(result.final_capital - default_params.inheritance_target) < tolerance

    def test_higher_return_increases_consumption(self, default_params):
        """Test that higher return allows for higher consumption."""
        result_low = compute_optimization(annual_return=0.03)
        result_high = compute_optimization(annual_return=0.08)
        
        assert result_high.initial_consumption > result_low.initial_consumption

    def test_capital_stays_positive(self, default_params):
        """Test that capital never goes negative."""
        result = compute_optimization(
            initial_capital=default_params.initial_capital,
            annual_return=default_params.annual_return,
            discount_rate=default_params.discount_rate,
            risk_aversion=default_params.risk_aversion,
            life_expectancy=default_params.life_expectancy,
            current_age=default_params.current_age,
            inheritance_target=default_params.inheritance_target,
        )
        
        for period in result.series:
            assert period.capital >= 0


class TestEdgeCases:
    def test_zero_inheritance_target(self):
        """Test optimization with zero bequest motive."""
        result = compute_optimization(inheritance_target=0)
        assert result.initial_consumption > 0
        # With zero inheritance, should consume more
        result_bequest = compute_optimization(inheritance_target=500000)
        assert result.initial_consumption > result_bequest.initial_consumption

    def test_short_horizon(self):
        """Test optimization with short horizon."""
        result = compute_optimization(
            current_age=80,
            life_expectancy=85,
            inheritance_target=100000,
        )
        assert result.horizon == 5
        assert result.initial_consumption > 0

    def test_high_risk_aversion(self):
        """Test with high risk aversion (smoother consumption)."""
        result = compute_optimization(risk_aversion=5.0)
        
        # High risk aversion should lead to less variable consumption
        consumptions = [p.consumption for p in result.series]
        std_dev = (sum((c - sum(consumptions)/len(consumptions))**2 for c in consumptions) / len(consumptions)) ** 0.5
        
        result_low = compute_optimization(risk_aversion=1.5)
        consumptions_low = [p.consumption for p in result_low.series]
        std_dev_low = (sum((c - sum(consumptions_low)/len(consumptions_low))**2 for c in consumptions_low) / len(consumptions_low)) ** 0.5
        
        # Lower risk aversion should have more variation
        assert std_dev < std_dev_low


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
