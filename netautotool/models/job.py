from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from models.device import Base
from datetime import datetime
import json

class JobSchedule(Base):
    __tablename__ = "job_schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    job_type = Column(String(20), default="RECURRING") # ONE_TIME or RECURRING
    task_type = Column(String(50), nullable=False) # BACKUP, STATUS_CHECK, HEALTH_CHECK, CUSTOM
    description = Column(Text, nullable=True)
    
    # Target Devices (JSON string list of IDs)
    device_ids = Column(Text, nullable=True)
    
    # Custom Commands (if task_type is CUSTOM)
    custom_commands = Column(Text, nullable=True)
    
    # Schedule info
    schedule_type = Column(String(20), default="INTERVAL") # INTERVAL or CRON
    schedule_value = Column(String(100), nullable=True) # e.g. "3600" or "0 0 * * *"
    
    # One-time execution
    run_at = Column(DateTime, nullable=True)
    
    is_active = Column(Boolean, default=True)
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "job_type": self.job_type,
            "task_type": self.task_type,
            "description": self.description,
            "device_ids": json.loads(self.device_ids) if self.device_ids else [],
            "custom_commands": self.custom_commands,
            "schedule_type": self.schedule_type,
            "schedule_value": self.schedule_value,
            "run_at": self.run_at.isoformat() if self.run_at else None,
            "is_active": self.is_active,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None,
            "created_at": self.created_at.isoformat()
        }
