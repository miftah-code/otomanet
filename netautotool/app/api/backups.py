from flask import Blueprint, jsonify, send_file, request
from flask_login import login_required
import os
from datetime import datetime
from tasks import manual_backup_task
from celery.result import AsyncResult
from celery_app import celery_app

backups_bp = Blueprint('backups_api', __name__, url_prefix='/api/backups')

BACKUP_DIR = "/home/miftah/.antigravity-server/1.Project_Automation/netautotool/backup"

@backups_bp.route('/list')
@login_required
def list_backups():
    if not os.path.exists(BACKUP_DIR):
        return jsonify([])
    
    files = []
    for filename in os.listdir(BACKUP_DIR):
        if filename.endswith(".cfg"):
            path = os.path.join(BACKUP_DIR, filename)
            stats = os.stat(path)
            
            # Format: hostname_timestamp.cfg
            parts = filename.replace(".cfg", "").split("_")
            hostname = parts[0] if parts else "Unknown"
            
            files.append({
                "filename": filename,
                "hostname": hostname,
                "size": f"{stats.st_size / 1024:.1f} KB",
                "timestamp": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                "success": True
            })
    
    # Sort by timestamp desc
    files.sort(key=lambda x: x["timestamp"], reverse=True)
    return jsonify(files)

@backups_bp.route('/download/<path:filename>')
@login_required
def download_backup(filename):
    path = os.path.join(BACKUP_DIR, filename)
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    return jsonify({"error": "File not found"}), 404

@backups_bp.route('/delete/<path:filename>', methods=['DELETE'])
@login_required
def delete_backup(filename):
    path = os.path.join(BACKUP_DIR, filename)
    if os.path.exists(path):
        os.remove(path)
        return jsonify({"success": True})
    return jsonify({"error": "File not found"}), 404

@backups_bp.route('/run', methods=['POST'])
@login_required
def run_backup():
    data = request.get_json()
    device_ids = data.get('device_ids', [])
    if not device_ids:
        return jsonify({"error": "No devices selected"}), 400
        
    # Trigger tasks in parallel
    from tasks import backup_single_device
    task_ids = []
    for d_id in device_ids:
        task = backup_single_device.delay(d_id)
        task_ids.append(task.id)
        
    return jsonify({"success": True, "task_ids": task_ids})

@backups_bp.route('/status/group', methods=['POST'])
@login_required
def get_group_status():
    data = request.get_json()
    task_ids = data.get('task_ids', [])
    
    results = []
    completed = 0
    for tid in task_ids:
        res = AsyncResult(tid, app=celery_app)
        if res.ready():
            results.append({"task_id": tid, "status": res.status, "result": res.result})
            completed += 1
        else:
            results.append({"task_id": tid, "status": res.status})
            
    return jsonify({
        "completed": completed,
        "total": len(task_ids),
        "tasks": results,
        "done": completed == len(task_ids)
    })

@backups_bp.route('/status/<task_id>')
@login_required
def get_backup_status(task_id):
    res = AsyncResult(task_id, app=celery_app)
    if res.ready():
        return jsonify({"status": res.status, "result": res.result})
    return jsonify({"status": res.status})
