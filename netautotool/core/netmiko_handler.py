from netmiko import ConnectHandler, NetmikoTimeoutException, NetmikoAuthenticationException
from utils.logger import get_logger
from typing import List, Dict, Optional
import time

logger = get_logger("netmiko_handler")

class NetmikoHandler:
    CONFIG_COMMANDS = {
        "cisco_ios": "show running-config",
        "cisco_xe": "show running-config",
        "mikrotik_routeros": "/export",
        "juniper_junos": "show configuration",
        "fortinet": "show full-configuration",
        "fortinet_fortios": "show full-configuration"
    }

    def __init__(self, device_data: Dict):
        self.connection_params = {
            "device_type": device_data.get("device_type"),
            "host": device_data.get("host"),
            "username": device_data.get("username"),
            "password": device_data.get("password"),
            "secret": device_data.get("secret"),
            "port": device_data.get("port", 22),
            "timeout": 60,
            "global_delay_factor": 2,
        }
        
        # Map our internal device types to Netmiko's expected device_types
        mapping = {
            "fortinet_fortios": "fortinet",
            "cisco_ios": "cisco_ios",
            "cisco_xe": "cisco_ios",
            "mikrotik_routeros": "mikrotik_routeros",
            "juniper_junos": "juniper_junos"
        }
        self.connection_params["device_type"] = mapping.get(
            self.connection_params["device_type"], 
            self.connection_params["device_type"]
        )
        
        self.connection = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    def connect(self) -> bool:
        try:
            logger.info(f"Connecting to {self.connection_params['host']}...")
            self.connection = ConnectHandler(**self.connection_params)
            
            is_cisco = "cisco" in self.connection_params["device_type"]
            is_mikrotik = "mikrotik" in self.connection_params["device_type"]
            
            if is_cisco:
                if self.connection_params["secret"]:
                    self.connection.enable()
                self.connection.send_command("terminal length 0")
            
            # Khusus MikroTik: Matikan paging
            if is_mikrotik:
                self.connection.send_command("/console set screen-lines=0", expect_string=r"[@\w]+")
                self.connection.send_command("/console set screen-width=0", expect_string=r"[@\w]+")
                
            return True
        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            raise

    def disconnect(self):
        if self.connection:
            self.connection.disconnect()

    def send_command(self, command: str) -> str:
        """
        Gunakan cmd_verify=False untuk MikroTik guna menghindari penangkapan echo karakter per karakter.
        """
        try:
            if not self.connection: self.connect()
            
            is_mikrotik = "mikrotik" in self.connection_params["device_type"]
            is_config_cmd = any(cmd in command for cmd in self.CONFIG_COMMANDS.values())
            
            # Setup parameter khusus
            params = {
                "command_string": command,
                "delay_factor": 10 if is_config_cmd and is_mikrotik else (4 if is_config_cmd else 1)
            }
            
            # Matikan verifikasi echo untuk MikroTik agar tidak 'double' atau 'terpotong'
            if is_mikrotik:
                params["cmd_verify"] = False
            
            return self.connection.send_command(**params)
        except Exception as e:
            logger.error(f"Command execution error: {str(e)}")
            return f"Error: {str(e)}"

    def send_config_set(self, config_lines: List[str]) -> str:
        try:
            if not self.connection: self.connect()
            # Gunakan cmd_verify=False juga saat push config ke MikroTik
            if "mikrotik" in self.connection_params["device_type"]:
                return self.connection.send_config_set(config_lines, cmd_verify=False)
            return self.connection.send_config_set(config_lines)
        except Exception as e:
            logger.error(f"Config push error: {str(e)}")
            return f"Error: {str(e)}"

    def get_running_config(self) -> str:
        device_type = self.connection_params["device_type"]
        command = self.CONFIG_COMMANDS.get(device_type, "show running-config")
        return self.send_command(command)

    def test_connection(self) -> Dict:
        try:
            if self.connect():
                self.disconnect()
                return {"success": True, "message": "Connected successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}
