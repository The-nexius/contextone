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
    app_url: str = "https://contextone.space"
    api_url: str = "http://3.235.139.249:8018"
    
    # OpenAI for embeddings
    openai_api_key: str = ""
    
    # AWS Bedrock for embeddings
    aws_bearer_token_bedrock: str = ""
    aws_region: str = "us-east-1"
    embedding_model: str = "amazon.titan-embed-text-v1"
    
    @property
    def aws_access_key_id(self) -> str:
        """Extract access key from bearer token"""
        # Bearer token format: ABSK...:actual_key
        if self.aws_bearer_token_bedrock and ':' in self.aws_bearer_token_bedrock:
            return self.aws_bearer_token_bedrock.split(':')[0]
        return ""
    
    @property
    def aws_secret_access_key(self) -> str:
        """Extract secret key from bearer token"""
        if self.aws_bearer_token_bedrock and ':' in self.aws_bearer_token_bedrock:
            return self.aws_bearer_token_bedrock.split(':', 1)[1]
        return ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()