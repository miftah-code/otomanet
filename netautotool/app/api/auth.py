from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, current_user, login_required
from models.user import User
from models.audit_log import AuditLog
from app.database import SessionLocal
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False

        from app.database import db_session
        user = db_session.query(User).filter(User.username == username).first()
        
        if user and user.check_password(password):
            if not user.is_active:
                flash('Your account is inactive. Please contact administrator.', 'danger')
                return render_template('login.html')
                
            login_user(user, remember=remember)
            user.last_login = datetime.utcnow()
            user.last_login_ip = request.headers.get('CF-Connecting-IP', request.remote_addr)
            db_session.commit()
            
            AuditLog.record("LOGIN")
            
            if user.force_password_change:
                return redirect(url_for('auth.change_password'))
            
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        
        AuditLog.record("LOGIN_FAILED", detail={"attempted_username": username})
        flash('Login failed. Please check your username and password.', 'danger')

    return render_template('login.html')

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    AuditLog.record("LOGOUT")
    logout_user()
    return redirect(url_for('auth.login'))

@auth_bp.route('/change-password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        new_password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if new_password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('change_password.html')
            
        if len(new_password) < 8:
            flash('Password must be at least 8 characters.', 'danger')
            return render_template('change_password.html')

        db = SessionLocal()
        user = db.query(User).filter(User.id == current_user.id).first()
        user.set_password(new_password)
        user.force_password_change = False
        db.commit()
        db.close()
        
        AuditLog.record("CHANGE_PASSWORD")
        flash('Password updated successfully.', 'success')
        return redirect(url_for('dashboard'))

    return render_template('change_password.html')

@auth_bp.route('/me')
@login_required
def me():
    return jsonify(current_user.to_dict())
