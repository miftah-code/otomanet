from flask import Blueprint, request, jsonify
from flask_login import login_required
from models.device import Device
from models.cmd_template import CommandTemplate
from app.database import db_session
from tasks import verify_config_task
from celery.result import AsyncResult
from celery_app import celery_app

verification_bp = Blueprint('verification', __name__, url_prefix='/api/verification')

@verification_bp.route('/run', methods=['POST'])
@login_required
def run_verification():
    data = request.get_json()
    device_ids = data.get('device_ids', [])
    commands = data.get('commands', [])
    
    task_ids = []
    for d_id in device_ids:
        task = verify_config_task.delay(d_id, commands)
        task_ids.append({"device_id": d_id, "task_id": task.id})
    
    return jsonify({"success": True, "tasks": task_ids})

@verification_bp.route('/status/<task_id>')
@login_required
def get_task_status(task_id):
    res = AsyncResult(task_id, app=celery_app)
    if res.ready():
        return jsonify({"status": res.status, "result": res.result})
    return jsonify({"status": res.status, "progress": 0})

@verification_bp.route('/templates')
@login_required
def list_templates():
    templates = db_session.query(CommandTemplate).all()
    return jsonify([{"id": t.id, "name": t.name, "command": t.command, "vendor_type": t.vendor_type, "description": t.description} for t in templates])

@verification_bp.route('/templates', methods=['POST'])
@login_required
def create_template():
    data = request.get_json()
    new_t = CommandTemplate(
        name=data.get('name'),
        command=data.get('command'),
        vendor_type=data.get('vendor_type'),
        description=data.get('description')
    )
    db_session.add(new_t)
    db_session.commit()
    return jsonify({"id": new_t.id, "name": new_t.name}), 201
