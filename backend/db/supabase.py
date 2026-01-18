"""
Supabase database connection and utilities
"""

import os
from supabase import create_client, Client
from typing import Optional


class SupabaseDB:
    """Supabase database connection manager."""
    
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance."""
        if cls._instance is None:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_KEY")
            
            if not url or not key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_SERVICE_KEY environment "
                    "variables must be set"
                )
            
            cls._instance = create_client(url, key)
        
        return cls._instance
    
    @classmethod
    def reset(cls):
        """Reset the client instance (useful for testing)."""
        cls._instance = None


def get_db() -> Client:
    """Dependency for getting database client."""
    return SupabaseDB.get_client()


# User profile operations
async def get_user_profile(client: Client, user_id: str):
    """Get user profile by ID."""
    response = client.table("profiles").select("*").eq("id", user_id).single().execute()
    return response.data


async def create_user_profile(client: Client, user_id: str, email: str, full_name: str = None):
    """Create a new user profile."""
    data = {
        "id": user_id,
        "email": email,
        "full_name": full_name
    }
    response = client.table("profiles").insert(data).execute()
    return response.data


# Estimator operations
async def get_user_estimators(client: Client, user_id: str):
    """Get all estimators for a user."""
    response = (
        client.table("estimators")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


async def create_estimator(client: Client, user_id: str, data: dict):
    """Create a new estimator configuration."""
    estimator_data = {
        "user_id": user_id,
        **data
    }
    response = client.table("estimators").insert(estimator_data).execute()
    return response.data


async def update_estimator(client: Client, estimator_id: str, data: dict):
    """Update an estimator configuration."""
    response = (
        client.table("estimators")
        .update(data)
        .eq("id", estimator_id)
        .execute()
    )
    return response.data


async def delete_estimator(client: Client, estimator_id: str):
    """Delete an estimator configuration."""
    response = client.table("estimators").delete().eq("id", estimator_id).execute()
    return response.data


# Optimization series operations
async def save_optimization_series(client: Client, estimator_id: str, series: list):
    """Save optimization series results."""
    # Delete existing series for this estimator
    client.table("optimization_series").delete().eq("estimator_id", estimator_id).execute()
    
    # Insert new series
    series_data = [
        {
            "estimator_id": estimator_id,
            "period": item["period"],
            "capital": item["capital"],
            "consumption": item["consumption"],
            "utility": item.get("utility")
        }
        for item in series
    ]
    
    response = client.table("optimization_series").insert(series_data).execute()
    return response.data


async def get_optimization_series(client: Client, estimator_id: str):
    """Get optimization series for an estimator."""
    response = (
        client.table("optimization_series")
        .select("*")
        .eq("estimator_id", estimator_id)
        .order("period")
        .execute()
    )
    return response.data
