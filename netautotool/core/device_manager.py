from sqlalchemy.orm import Session
from models.device import Device
from utils.crypto import encrypt_password, decrypt_password
from utils.logger import get_logger
from core.netmiko_handler import NetmikoHandler
from datetime import datetime
from typing import List, Optional, Dict
import os

logger = get_logger("device_manager")

class DeviceManager:
    def __init__(self, db: Session):
        self.db = db

    def add_device(self, hostname: str, ip: str, device_type: str, username: str, password: str, secret: str = None, port: int = 22) -> Device:
        encrypted_pw = encrypt_password(password)
        encrypted_sec = encrypt_password(secret) if secret else None

        new_device = Device(
            hostname=hostname,
            ip_address=ip,
            device_type=device_type,
            username=username,
            password=encrypted_pw,
            secret=encrypted_sec,
            port=port
        )
        self.db.add(new_device)
        self.db.commit()
        self.db.refresh(new_device)
        return new_device

    def get_device(self, device_id: int) -> Optional[Device]:
        return self.db.query(Device).filter(Device.id == device_id).first()

    def list_devices(self) -> List[Device]:
        return self.db.query(Device).all()

    def update_device(self, device_id: int, **kwargs) -> Device:
        device = self.get_device(device_id)
        if not device: raise ValueError("Device not found")
        for key, value in kwargs.items():
            if key in ["password", "secret"]:
                setattr(device, key, encrypt_password(value))
            elif hasattr(device, key):
                setattr(device, key, value)
        self.db.commit()
        self.db.refresh(device)
        return device

    def delete_device(self, device_id: int) -> bool:
        device = self.get_device(device_id)
        if device:
            self.db.delete(device)
            self.db.commit()
            return True
        return False

    def _get_connection_data(self, device: Device) -> Dict:
        return {
            "host": device.ip_address,
            "username": device.username,
            "password": decrypt_password(device.password),
            "secret": decrypt_password(device.secret) if device.secret else None,
            "device_type": device.device_type,
            "port": device.port
        }

    def test_connection(self, device_id: int) -> Dict:
        device = self.get_device(device_id)
        if not device: return {"success": False, "error": "Device not found"}
        try:
            conn_data = self._get_connection_data(device)
            handler = NetmikoHandler(conn_data)
            res = handler.test_connection()
            device.is_active = res["success"]
            self.db.commit()
            return res
        except Exception as e:
            device.is_active = False
            self.db.commit()
            return {"success": False, "error": str(e)}

    def get_config(self, device_id: int) -> Dict:
        """Retrieve running configuration from device."""
        device = self.get_device(device_id)
        if not device: return {"success": False, "error": "Device not found"}
        try:
            conn_data = self._get_connection_data(device)
            with NetmikoHandler(conn_data) as handler:
                config = handler.get_running_config()
                return {"success": True, "config": config, "timestamp": datetime.now().isoformat()}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def push_config(self, device_id: int, config_lines: List[str]) -> Dict:
        device = self.get_device(device_id)
        if not device: return {"success": False, "error": "Device not found"}
        try:
            conn_data = self._get_connection_data(device)
            with NetmikoHandler(conn_data) as handler:
                output = handler.send_config_set(config_lines)
                return {"success": True, "output": output, "hostname": device.hostname}
        except Exception as e:
            return {"success": False, "error": str(e), "hostname": device.hostname}

    def execute_command(self, device_id: int, command: str) -> str:
        device = self.get_device(device_id)
        if not device: return "Error: Device not found"
        try:
            conn_data = self._get_connection_data(device)
            with NetmikoHandler(conn_data) as handler:
                return handler.send_command(command)
        except Exception as e:
            return f"Error: {str(e)}"

    def bulk_push_config(self, device_ids: List[int], config_lines: List[str]) -> List[Dict]:
        results = []
        for d_id in device_ids:
            results.append(self.push_config(d_id, config_lines))
        return results

    def bulk_backup(self, device_ids: List[int]) -> List[Dict]:
        results = []
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backup")
        os.makedirs(backup_base, exist_ok=True)
        
        for d_id in device_ids:
            device = self.get_device(d_id)
            if not device: continue
            res = self.get_config(d_id)
            if res["success"]:
                filename = f"{device.hostname}_{timestamp}.cfg"
                with open(os.path.join(backup_base, filename), "w") as f:
                    f.write(res["config"])
                results.append({"hostname": device.hostname, "success": True, "file": filename})
            else:
                results.append({"hostname": device.hostname, "success": False, "error": res.get("error")})
        return results
