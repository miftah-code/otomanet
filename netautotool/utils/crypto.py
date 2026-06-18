from cryptography.fernet import Fernet
from config import settings
import logging

logger = logging.getLogger(__name__)

def get_cipher() -> Fernet:
    try:
        if not settings.ENCRYPTION_KEY:
            raise ValueError("ENCRYPTION_KEY is not set.")
        return Fernet(settings.ENCRYPTION_KEY.encode())
    except Exception as e:
        logger.error(f"Cipher init error: {e}")
        raise

def encrypt_password(plain_text: str) -> str:
    if not plain_text:
        return ""
    try:
        cipher = get_cipher()
        return cipher.encrypt(str(plain_text).encode()).decode()
    except Exception:
        return ""

def decrypt_password(cipher_text: str) -> str:
    if not cipher_text or len(str(cipher_text)) < 10:
        return ""
    try:
        cipher = get_cipher()
        return cipher.decrypt(str(cipher_text).encode()).decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return ""
