from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app.database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

class User(UserMixin, Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(128))
    role = Column(String(20), default="viewer") # admin, operator, viewer
    is_active = Column(Boolean, default=True)
    force_password_change = Column(Boolean, default=True)
    last_login = Column(DateTime)
    last_login_ip = Column(String(45))
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(64))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role == "admin"

    def is_operator_or_above(self):
        return self.role in ["admin", "operator"]

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "force_password_change": self.force_password_change,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat()
        }
