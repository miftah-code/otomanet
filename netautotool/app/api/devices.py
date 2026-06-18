from flask import Blueprint, request, jsonify, send_file, abort
from flask_login import login_required
from core.device_manager import DeviceManager
from models.device import Device
from app.database import db_session
from tasks import verify_config_task
import os

devices_bp = Blueprint('devices', __name__, url_prefix='/api/devices')

@devices_bp.route('/<int:id>/verify', methods=['POST'])
@login_required
def verify_device_config(id):
    data = request.get_json()
    commands = data.get('commands', [])
    # We call the task directly here (or .delay() for async)
    # For instant feedback in UI, we'll run it and wait
    result = verify_config_task(id, commands)
    return jsonify(result)

@devices_bp.route('/reports/<path:filename>')
@login_required
def download_report(filename):
    path = f"/home/miftah/.antigravity-server/1.Project_Automation/netautotool/reports/{filename}"
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    return jsonify({"error": "Report not found"}), 404

@devices_bp.route('/<int:id>')
@login_required
def get_device(id):
    device = DeviceManager(db_session).get_device(id)
    if not device:
        return jsonify({"error": "Device not found"}), 404
    return jsonify(device.to_dict())

@devices_bp.route('/')
@login_required
def list_devices():
    devices = DeviceManager(db_session).list_devices()
    return jsonify([d.to_dict() for d in devices])

@devices_bp.route('/', methods=['POST'])
@login_required
def add_device():
    data = request.get_json()
    try:
        new_device = DeviceManager(db_session).add_device(
            hostname=data.get('hostname'),
            ip=data.get('ip_address'),
            device_type=data.get('device_type'),
            username=data.get('username'),
            password=data.get('password'),
            secret=data.get('secret'),
            port=data.get('port', 22)
        )
        return jsonify(new_device.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@devices_bp.route('/<int:id>', methods=['PUT'])
@login_required
def update_device(id):
    data = request.get_json()
    try:
        updated_device = DeviceManager(db_session).update_device(id, **data)
        if not updated_device:
            return jsonify({"error": "Device not found"}), 404
        return jsonify(updated_device.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@devices_bp.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_device(id):
    if not DeviceManager(db_session).delete_device(id):
        return jsonify({"error": "Device not found"}), 404
    return jsonify({"success": True})

@devices_bp.route('/<int:id>/test-connection', methods=['POST'])
@login_required
def test_connection(id):
    result = DeviceManager(db_session).test_connection(id)
    return jsonify(result)

@devices_bp.route('/<int:id>/config')
@login_required
def get_config(id):
    res = DeviceManager(db_session).get_config(id)
    if not res["success"]: 
        return jsonify(res), 500
    return jsonify(res)

@devices_bp.route('/bulk-push-config', methods=['POST'])
@login_required
def bulk_push_config():
    data = request.get_json()
    device_ids = data.get('device_ids', [])
    commands = data.get('commands', [])
    
    from tasks import push_config_single_device
    task_ids = []
    for d_id in device_ids:
        task = push_config_single_device.delay(d_id, commands)
        task_ids.append(task.id)
        
    return jsonify({"success": True, "task_ids": task_ids})

@devices_bp.route('/bulk-backup', methods=['POST'])
@login_required
def bulk_backup():
    data = request.get_json()
    device_ids = data.get('device_ids', [])
    result = DeviceManager(db_session).bulk_backup(device_ids)
    return jsonify(result)
