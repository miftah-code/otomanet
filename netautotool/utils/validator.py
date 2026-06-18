import ipaddress
import re

SUPPORTED_DEVICE_TYPES = [
    "cisco_ios", "cisco_xe", "cisco_nxos",
    "mikrotik_routeros",
    "juniper_junos",
    "aruba_os", "hp_procurve"
]

def validate_ip(ip: str) -> bool:
    """Validate IPv4 or IPv6 address format."""
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False

def validate_device_type(dtype: str) -> bool:
    """Check if device type is supported by OTOMANET."""
    return dtype in SUPPORTED_DEVICE_TYPES

def validate_port(port: int) -> bool:
    """Validate TCP port range."""
    return 1 <= port <= 65535

def sanitize_command(command: str) -> str:
    """
    Basic sanitation to prevent common command injection patterns.
    Note: Network devices have different shells, this is a generic safety layer.
    """
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[;&|`$]', '', command)
    return sanitized.strip()
