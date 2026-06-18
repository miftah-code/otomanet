import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    """
    Application settings and configuration.
    Values are automatically loaded from environment variables or .env file.
    """
    # Security
    SECRET_KEY: str = "placeholder_secret_key"
    ENCRYPTION_KEY: str = ""  # Fernet key for device passwords
    
    # Database
    DATABASE_URL: str = "sqlite:///./otomanet.db"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent
    BACKUP_DIR: Path = BASE_DIR / "backup"
    
    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Initialize settings
settings = Settings()

# Ensure backup directory exists
os.makedirs(settings.BACKUP_DIR, exist_ok=True)
