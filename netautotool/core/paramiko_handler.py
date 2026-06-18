import paramiko
from utils.logger import get_logger
import os

logger = get_logger("paramiko_handler")

class ParamikoHandler:
    """
    Fallback SSH and SFTP handler using Paramiko.
    """
    
    @staticmethod
    def connect(host, username, password, port=22):
        """Create a Paramiko SSH client."""
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(host, port=port, username=username, password=password, timeout=10)
            return client
        except Exception as e:
            logger.error(f"Paramiko connection failed to {host}: {e}")
            raise

    @staticmethod
    def execute_command(ssh_client, command):
        """Execute a shell command via SSH client."""
        try:
            stdin, stdout, stderr = ssh_client.exec_command(command)
            return stdout.read().decode(), stderr.read().decode()
        except Exception as e:
            logger.error(f"Paramiko execution failed: {e}")
            return "", str(e)

    @staticmethod
    def upload_file(ssh_client, local_path, remote_path):
        """Upload a file via SFTP."""
        try:
            sftp = ssh_client.open_sftp()
            sftp.put(local_path, remote_path)
            sftp.close()
            logger.info(f"Uploaded {local_path} to {remote_path}")
        except Exception as e:
            logger.error(f"SFTP upload failed: {e}")
            raise

    @staticmethod
    def download_file(ssh_client, remote_path, local_path):
        """Download a file via SFTP."""
        try:
            sftp = ssh_client.open_sftp()
            sftp.get(remote_path, local_path)
            sftp.close()
            logger.info(f"Downloaded {remote_path} to {local_path}")
        except Exception as e:
            logger.error(f"SFTP download failed: {e}")
            raise

    @staticmethod
    def close(ssh_client):
        """Close SSH client."""
        if ssh_client:
            ssh_client.close()
