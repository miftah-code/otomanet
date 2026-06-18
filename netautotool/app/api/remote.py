from flask import Blueprint, request
from flask_socketio import emit, join_room
from app.extensions import socketio
from flask_login import current_user
from models.device import Device
from app.database import db_session
from utils.crypto import decrypt_password
import paramiko
import os

remote_bp = Blueprint('remote_api', __name__)

# Dictionary to store active SSH channels: { session_id: { channel: ch, ssh: ssh_client } }
active_sessions = {}

def read_from_ssh(session_id, channel):
    """Background task to read from SSH and emit to frontend."""
    try:
        while True:
            if session_id not in active_sessions:
                break
            
            # Blocking read is greenlet-friendly with gevent and much more reliable
            data = channel.recv(4096)
            if not data:
                break
                
            decoded_data = data.decode('utf-8', errors='ignore')
            socketio.emit('terminal_output', {'data': decoded_data}, room=session_id)
            
    except Exception as e:
        print(f"SSH Read Error for {session_id}: {e}")
    finally:
        socketio.emit('terminal_output', {'data': '\r\n[Connection closed]\r\n'}, room=session_id)

@socketio.on('connect_terminal')
def on_connect_terminal(data):
    print(f"connect_terminal received data: {data}")
    if not current_user.is_authenticated:
        print("User not authenticated for terminal!")
        return
    
    device_id = data.get('device_id')
    device = db_session.query(Device).get(device_id)
    print(f"Device found: {device}")
    if not device:
        emit('terminal_output', {'data': 'Device not found.\r\n'})
        return

    session_id = request.sid
    join_room(session_id)
    
    emit('terminal_output', {'data': f'Establishing SSH session to {device.hostname}...\r\n'})
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        password = decrypt_password(device.password)
        ssh.connect(
            hostname=device.ip_address,
            username=device.username,
            password=password,
            port=device.port or 22,
            timeout=15,
            allow_agent=False,
            look_for_keys=False
        )
        
        channel = ssh.invoke_shell(term='xterm', width=100, height=30)
        active_sessions[session_id] = {'channel': channel, 'ssh': ssh}
        
        # Start background task to read from SSH
        socketio.start_background_task(read_from_ssh, session_id, channel)
        
    except Exception as e:
        emit('terminal_output', {'data': f'\r\nConnection failed: {str(e)}\r\n'})

@socketio.on('terminal_input')
def on_terminal_input(data):
    session_id = request.sid
    if session_id in active_sessions:
        try:
            channel = active_sessions[session_id]['channel']
            channel.send(data.get('data'))
        except Exception as e:
            print(f"Terminal input error: {e}")

@socketio.on('disconnect')
def on_disconnect():
    session_id = request.sid
    if session_id in active_sessions:
        try:
            active_sessions[session_id]['channel'].close()
            active_sessions[session_id]['ssh'].close()
        except:
            pass
        del active_sessions[session_id]
