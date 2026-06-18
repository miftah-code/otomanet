from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class DeviceType(str, enum.Enum):
    """
    Supported device types for the automation platform.
    """
    CISCO_IOS = "cisco_ios"
    CISCO_XE = "cisco_xe"
    MIKROTIK_ROUTEROS = "mikrotik_routeros"
    JUNIPER_JUNOS = "juniper_junos"
    FORTINET_FORTIOS = "fortinet_fortios"
    FORTINET = "fortinet"
    PALOALTO = "paloalto"
    HUAWEI = "huawei"
    OTHER = "other"

class Device(Base):
    """
    SQLAlchemy model representing a network device.
    """
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, unique=True, index=True, nullable=False)
    ip_address = Column(String, index=True, nullable=False)
    
    # Device platform identifier for Netmiko/Napalm
    device_type = Column(String, nullable=False) 
    
    # Credentials
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)  # Stored as ENCRYPTED string
    secret = Column(String, nullable=True)    # For Cisco Enable Password
    port = Column(Integer, default=22)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    health_status = Column(String, default="UNKNOWN") # UP, SLOW, DOWN, UNKNOWN
    last_ping_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "hostname": self.hostname,
            "ip_address": self.ip_address,
            "device_type": self.device_type,
            "username": self.username,
            "port": self.port,
            "is_active": self.is_active,
            "health_status": self.health_status,
            "last_ping_ms": self.last_ping_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<Device(hostname='{self.hostname}', ip='{self.ip_address}', type='{self.device_type}')>"
