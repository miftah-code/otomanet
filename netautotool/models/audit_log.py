from app.database import Base, SessionLocal
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from flask import request
from flask_login import current_user
import json

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, index=True)
    username = Column(String(64))
    action = Column(String(50), nullable=False)
    target_type = Column(String(50)) # DEVICE, USER, SETTING, etc.
    target_id = Column(String(50))
    target_name = Column(String(100))
    detail = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow)

    @classmethod
    def record(cls, action, target_type=None, target_id=None, target_name=None, detail=None):
        db = SessionLocal()
        try:
            log = cls(
                user_id=current_user.id if current_user and not current_user.is_anonymous else None,
                username=current_user.username if current_user and not current_user.is_anonymous else "system",
                action=action,
                target_type=target_type,
                target_id=str(target_id) if target_id else None,
                target_name=target_name,
                detail=json.dumps(detail) if detail else None,
                ip_address=request.headers.get('CF-Connecting-IP', request.remote_addr),
                user_agent=request.user_agent.string
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"Error recording audit log: {e}")
        finally:
            db.close()
