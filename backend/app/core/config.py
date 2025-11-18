from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Dict, Any
from functools import lru_cache

class Settings(BaseSettings):
    # Environment Settings
    ENVIRONMENT: str = "dev"  # Can be 'dev', 'qa', or 'uat'
    
    # Project Info
    PROJECT_NAME: str = "Z API"
    PROJECT_DESCRIPTION: str = """
    API for managing Z voice agents, phone numbers, and call history.

    Key features:
    * Create and manage AI voice agents
    * List available voices and phone numbers
    * Track call history and analytics
    * Monitor costs and transcripts
    """
    VERSION: str = "1.0.0"
    
    # API Documentation
    CONTACT: Dict[str, str] = {
        "name": "API Support",
        "url": "https://retell.cc/docs",
    }
    LICENSE_INFO: Dict[str, str] = {
        "name": "Contact Retell for licensing",
        "url": "https://retell.cc",
    }
    
    # Environment 
    RETELL_API_KEY: str ="key_779500b003e448e283964210d05e"
    PORT: int = 8080  # Default port for Cloud Run
    HOST: str = "0.0.0.0"  # Use 0.0.0.0 for production in Cloud Run
    
    # Database Settings
    DATABASE_URL: str = "postgresql://postgres:Admin%40011235@35.232.108.201:5432/livekit?sslmode=require"
    
    # File Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()