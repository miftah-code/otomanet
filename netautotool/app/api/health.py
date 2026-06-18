from flask import Blueprint, request, jsonify
from flask_login import login_required
from models.device import Device
from app.database import db_session
import socket
import time

health_bp = Blueprint('health', __name__, url_prefix='/api/health')

@health_bp.route('/status')
@login_required
def get_all_health():
    devices = db_session.query(Device).all()
    results = []
    for d in devices:
        results.append({
            "id": d.id,
            "hostname": d.hostname,
            "ip": d.ip_address,
            "ping_ms": d.last_ping_ms,
            "status": d.health_status,
            "is_active": d.is_active
        })
    return jsonify(results)

@health_bp.route('/check/<int:device_id>', methods=['POST'])
@login_required
def force_health_check(device_id):
    device = db_session.query(Device).filter(Device.id == device_id).first()
    if not device:
        return jsonify({"error": "Device not found"}), 404
    
    try:
        start_time = time.time()
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        result = s.connect_ex((device.ip_address, device.port or 22))
        end_time = time.time()
        
        if result == 0:
            ping_ms = int((end_time - start_time) * 1000)
            device.last_ping_ms = ping_ms
            device.health_status = "UP" if ping_ms < 200 else "SLOW"
        else:
            device.last_ping_ms = None
            device.health_status = "DOWN"
        s.close()
            
        db_session.commit()
        return jsonify({
            "success": True, 
            "ping_ms": device.last_ping_ms, 
            "status": device.health_status
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
