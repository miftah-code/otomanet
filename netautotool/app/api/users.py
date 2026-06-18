from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from models.user import User
from models.audit_log import AuditLog
from app.database import SessionLocal
from utils.auth import role_required

users_bp = Blueprint('users_api', __name__)

@users_bp.route('/api/users', methods=['GET'])
@login_required
@role_required('admin')
def list_users():
    from app.database import db_session
    users = db_session.query(User).all()
    return jsonify([u.to_dict() for u in users])

@users_bp.route('/api/users', methods=['POST'])
@login_required
@role_required('admin')
def create_user():
    data = request.json
    from app.database import db_session
    
    if db_session.query(User).filter(User.username == data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
        
    user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'viewer'),
        created_by=current_user.username
    )
    user.set_password(data['password'])
    db_session.add(user)
    db_session.commit()
    
    AuditLog.record("ADD_USER", target_type="USER", target_id=user.id, target_name=user.username)
    
    return jsonify(user.to_dict()), 201

@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@login_required
@role_required('admin')
def update_user(user_id):
    data = request.json
    from app.database import db_session
    user = db_session.query(User).get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if 'role' in data: user.role = data['role']
    if 'is_active' in data: user.is_active = data['is_active']
    if 'password' in data:
        user.set_password(data['password'])
        user.force_password_change = True
        
    db_session.commit()
    AuditLog.record("EDIT_USER", target_type="USER", target_id=user.id, target_name=user.username)
    
    return jsonify(user.to_dict())

@users_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
@role_required('admin')
def delete_user(user_id):
    if current_user.id == user_id:
        return jsonify({"error": "You cannot delete yourself"}), 400
        
    from app.database import db_session
    user = db_session.query(User).get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Check if last admin
    if user.role == 'admin':
        admin_count = db_session.query(User).filter(User.role == 'admin', User.is_active == True).count()
        if admin_count <= 1:
            return jsonify({"error": "Cannot delete the last active administrator"}), 400

    AuditLog.record("DELETE_USER", target_type="USER", target_id=user.id, target_name=user.username)
    db_session.delete(user)
    db_session.commit()
    return jsonify({"success": True})
