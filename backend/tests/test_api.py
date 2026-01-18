"""
Tests for API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthEndpoint:
    def test_health_check(self, client):
        """Test health check endpoint returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestOptimizationEndpoint:
    def test_optimize_default_params(self, client):
        """Test optimization with default parameters."""
        response = client.post("/api/v1/optimize", json={})
        assert response.status_code == 200
        data = response.json()
        assert "initial_consumption" in data
        assert "series" in data
        assert len(data["series"]) > 0

    def test_optimize_custom_params(self, client):
        """Test optimization with custom parameters."""
        params = {
            "initial_capital": 500000,
            "annual_return": 0.06,
            "discount_rate": 0.02,
            "risk_aversion": 1.5,
            "life_expectancy": 90,
            "current_age": 40,
            "inheritance_target": 100000
        }
        response = client.post("/api/v1/optimize", json=params)
        assert response.status_code == 200
        data = response.json()
        assert data["horizon"] == 50  # 90 - 40

    def test_optimize_invalid_ages(self, client):
        """Test that invalid age combination returns error."""
        params = {
            "life_expectancy": 60,
            "current_age": 65  # Current age > life expectancy
        }
        response = client.post("/api/v1/optimize", json=params)
        assert response.status_code == 400

    def test_preview_endpoint(self, client):
        """Test quick preview endpoint."""
        response = client.post("/api/v1/optimize/preview", json={})
        assert response.status_code == 200
        data = response.json()
        assert "initial_consumption" in data
        assert "beta" in data
        assert "growth_rate" in data

    def test_get_defaults(self, client):
        """Test getting default parameters."""
        response = client.get("/api/v1/parameters/defaults")
        assert response.status_code == 200
        data = response.json()
        assert "initial_capital" in data
        assert "annual_return" in data
        assert data["initial_capital"]["default"] == 1000000


class TestRootEndpoint:
    def test_root(self, client):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
