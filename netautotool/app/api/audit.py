from flask import Blueprint, request, jsonify, Response
from flask_login import login_required
from models.audit_log import AuditLog
from app.database import SessionLocal
from utils.auth import role_required
import csv
import io

audit_bp = Blueprint('audit_api', __name__)

@audit_bp.route('/api/audit/logs', methods=['GET'])
@login_required
@role_required('admin')
def list_logs():
    db = SessionLocal()
    query = db.query(AuditLog)
    
    # Filters
    username = request.args.get('user')
    action = request.args.get('action')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    if username: query = query.filter(AuditLog.username == username)
    if action: query = query.filter(AuditLog.action == action)
    if date_from: query = query.filter(AuditLog.timestamp >= date_from)
    if date_to: query = query.filter(AuditLog.timestamp <= date_to)
    
    logs = query.order_by(AuditLog.timestamp.desc()).limit(100).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "username": log.username,
            "action": log.action,
            "target": f"{log.target_type}: {log.target_name}" if log.target_type else "-",
            "ip": log.ip_address,
            "timestamp": log.timestamp.isoformat(),
            "detail": log.detail
        })
    
    db.close()
    return jsonify(result)

@audit_bp.route('/api/audit/logs/export', methods=['GET'])
@login_required
@role_required('admin')
def export_logs():
    db = SessionLocal()
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Timestamp', 'User', 'Action', 'Target Type', 'Target Name', 'IP Address', 'Detail'])
    
    for log in logs:
        writer.writerow([
            log.timestamp.isoformat(),
            log.username,
            log.action,
            log.target_type,
            log.target_name,
            log.ip_address,
            log.detail
        ])
    
    db.close()
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=audit_logs.csv"}
    )
