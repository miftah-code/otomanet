from app.database import Base, SessionLocal
from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
from flask_login import current_user

class AppSettings(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(64))

    @classmethod
    def get(cls, key, default=None):
        db = SessionLocal()
        try:
            setting = db.query(cls).filter(cls.key == key).first()
            return setting.value if setting else default
        finally:
            db.close()

    @classmethod
    def set(cls, key, value):
        db = SessionLocal()
        try:
            setting = db.query(cls).filter(cls.key == key).first()
            if not setting:
                setting = cls(key=key)
                db.add(setting)
            setting.value = str(value)
            setting.updated_by = current_user.username if current_user and not current_user.is_anonymous else "system"
            db.commit()
        finally:
            db.close()
