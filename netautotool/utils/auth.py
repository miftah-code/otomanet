from flask_login import LoginManager, current_user
from flask import abort, jsonify, redirect, url_for, request
from functools import wraps
from models.user import User
from models.audit_log import AuditLog
from app.database import SessionLocal

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'

@login_manager.user_loader
def load_user(user_id):
    from app.database import db_session
    return db_session.query(User).get(int(user_id))

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_view(*args, **kwargs):
            if not current_user.is_authenticated:
                return login_manager.unauthorized()
            if current_user.role not in roles:
                if request.is_json or request.path.startswith('/api/'):
                    return jsonify({"error": "Forbidden", "message": "You don't have permission to perform this action."}), 403
                return abort(403)
            return f(*args, **kwargs)
        return decorated_view
    return decorator

def log_action(action, target_type=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)
            # Logic to extract target info from result or kwargs could be added here
            AuditLog.record(action, target_type=target_type)
            return result
        return decorated_function
    return decorator
