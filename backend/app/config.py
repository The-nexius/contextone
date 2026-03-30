"""
Configuration settings for Context One API
"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Supabase settings
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""  # For server-side operations
    
    # JWT settings
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24 * 7  # 7 days
    
    # Stripe settings
    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""
    
    # App settings
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8001"
    
    # OpenAI for embeddings
    openai_api_key: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()