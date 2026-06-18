from flask import Blueprint, jsonify, request
from flask_login import login_required
from celery_app import celery_app
from celery.result import AsyncResult
from app.database import db_session
from models.audit_log import AuditLog
from models.job import JobSchedule
import tasks
import json
from datetime import datetime

jobs_bp = Blueprint('jobs_api', __name__)

@jobs_bp.route('/api/jobs/active', methods=['GET'])
@login_required
def list_active_jobs():
    i = celery_app.control.inspect(timeout=3)
    if not i:
        return jsonify([])
        
    active = i.active() or {}
    reserved = i.reserved() or {}
    
    all_jobs = []
    for worker, tasks_list in active.items():
        for task in tasks_list:
            all_jobs.append({
                "id": task["id"],
                "name": task["name"],
                "args": task["args"],
                "worker": worker,
                "time_start": task.get("time_start"),
                "status": "ACTIVE"
            })
    
    for worker, tasks_list in reserved.items():
        for task in tasks_list:
            all_jobs.append({
                "id": task["id"],
                "name": task["name"],
                "args": task["args"],
                "worker": worker,
                "status": "RESERVED"
            })
            
    return jsonify(all_jobs)

@jobs_bp.route('/api/jobs/scheduled', methods=['GET'])
@login_required
def list_scheduled_jobs():
    jobs = db_session.query(JobSchedule).order_by(JobSchedule.created_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs])

@jobs_bp.route('/api/jobs', methods=['POST'])
@login_required
def create_job():
    data = request.get_json()
    
    # Process run_at if it exists
    run_at_dt = None
    if data.get('run_at'):
        try:
            run_at_dt = datetime.fromisoformat(data.get('run_at').replace('Z', '+00:00'))
        except:
            pass

    new_job = JobSchedule(
        name=data.get('name'),
        job_type=data.get('job_type', 'RECURRING'),
        task_type=data.get('task_type'),
        schedule_type=data.get('schedule_type', 'INTERVAL'),
        schedule_value=data.get('schedule_value'),
        run_at=run_at_dt,
        device_ids=json.dumps(data.get('device_ids', [])),
        custom_commands=data.get('custom_commands'),
        description=data.get('description'),
        is_active=True
    )
    db_session.add(new_job)
    db_session.commit()
    return jsonify(new_job.to_dict()), 201

@jobs_bp.route('/api/jobs/<int:job_id>/start', methods=['POST'])
@login_required
def start_job_now(job_id):
    job = db_session.query(JobSchedule).get(job_id)
    if not job: return jsonify({"error": "Job not found"}), 404
    
    # Trigger the task based on task_type
    task_func = None
    kwargs = {}
    
    if job.task_type == 'BACKUP':
        task_func = tasks.run_auto_backup
    elif job.task_type == 'STATUS_CHECK':
        task_func = tasks.check_devices_status
    elif job.task_type == 'HEALTH_CHECK':
        task_func = tasks.health_check_all
    elif job.task_type == 'CUSTOM':
        task_func = tasks.run_custom_job_task
        device_ids = json.loads(job.device_ids) if job.device_ids else []
        commands = job.custom_commands.split('\n') if job.custom_commands else []
        kwargs = {"device_ids": device_ids, "commands": commands, "job_name": job.name}
        
    if task_func:
        task_func.delay(**kwargs)
        AuditLog.record("START_JOB_MANUAL", target_type="JOB", target_id=str(job_id), target_name=job.name)
        return jsonify({"success": True, "message": f"Job '{job.name}' triggered successfully"})
    
    return jsonify({"error": f"Unknown task type: {job.task_type}"}), 400

@jobs_bp.route('/api/jobs/<int:job_id>/toggle', methods=['POST'])
@login_required
def toggle_job(job_id):
    job = db_session.query(JobSchedule).get(job_id)
    if not job: return jsonify({"error": "Job not found"}), 404
    
    job.is_active = not job.is_active
    db_session.commit()
    action = "RESUMED" if job.is_active else "PAUSED"
    AuditLog.record(f"{action}_JOB", target_type="JOB", target_id=str(job_id), target_name=job.name)
    return jsonify({"success": True, "is_active": job.is_active})

@jobs_bp.route('/api/jobs/history', methods=['GET'])
@login_required
def list_job_history():
    logs = db_session.query(AuditLog).filter(
        AuditLog.action.in_(['BACKUP', 'PUSH_CONFIG', 'VERIFICATION', 'START_JOB_MANUAL', 'RESUMED_JOB', 'PAUSED_JOB'])
    ).order_by(AuditLog.timestamp.desc()).limit(50).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "action": log.action,
            "target": log.target_name,
            "user": log.username,
            "timestamp": log.timestamp.isoformat(),
            "status": "COMPLETED"
        })
    return jsonify(result)

@jobs_bp.route('/api/jobs/<task_id>', methods=['DELETE'])
@login_required
def cancel_job(task_id):
    # This is for cancelling ACTIVE tasks by Celery ID OR deleting a JobSchedule
    if task_id.isdigit():
        # If it's an ID for JobSchedule, delete the job
        job = db_session.query(JobSchedule).get(int(task_id))
        if job:
            db_session.delete(job)
            db_session.commit()
            return jsonify({"success": True})
    
    # Otherwise, it's a celery task ID
    celery_app.control.revoke(task_id, terminate=True)
    AuditLog.record("CANCEL_TASK", target_type="TASK", target_id=task_id)
    return jsonify({"success": True})
