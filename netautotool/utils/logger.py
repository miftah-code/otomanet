import logging
import os
from logging.handlers import RotatingFileHandler
from config import settings

def get_logger(name: str):
    """
    Setup and return a professional logger instance.
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers if logger is already initialized
    if logger.hasHandlers():
        return logger

    logger.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Create logs directory if not exists
    log_dir = settings.BASE_DIR / "logs"
    os.makedirs(log_dir, exist_ok=True)
    log_file = log_dir / "otomanet.log"

    # Format: [TIMESTAMP] [LEVEL] [MODULE] message
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # File Handler (Rotating)
    file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Stream Handler (Console)
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    return logger
