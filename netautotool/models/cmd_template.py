from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base
from datetime import datetime

class CommandTemplate(Base):
    __tablename__ = "command_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    command = Column(Text, nullable=False)
    vendor_type = Column(String(50), default="all") # all, cisco_ios, mikrotik_routeros, etc.
    description = Column(String(255))
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_builtin = Column(Boolean, default=False)

def seed_templates(db):
    builtins = [
        {"name": "Show IP Route", "command": "show ip route", "vendor_type": "cisco_ios", "description": "Display routing table"},
        {"name": "Show Interfaces Status", "command": "show interfaces status", "vendor_type": "cisco_ios", "description": "Display interface status"},
        {"name": "Show Version", "command": "show version", "vendor_type": "cisco_ios", "description": "Display system version"},
        {"name": "Print IP Route", "command": "/ip route print", "vendor_type": "mikrotik_routeros", "description": "Display MikroTik routing table"},
        {"name": "Print IP Address", "command": "/ip address print", "vendor_type": "mikrotik_routeros", "description": "Display MikroTik IP addresses"},
        {"name": "Show Configuration", "command": "show configuration", "vendor_type": "juniper_junos", "description": "Display Juniper configuration"},
    ]
    
    for t in builtins:
        exists = db.query(CommandTemplate).filter(CommandTemplate.name == t["name"]).first()
        if not exists:
            db.add(CommandTemplate(**t, is_builtin=True))
    db.commit()
