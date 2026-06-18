from flask import render_template, redirect, url_for, send_from_directory
from flask_login import login_required
from app.database import SessionLocal
from models.device import Device
from models.user import User
from utils.auth import role_required
import os

def register_routes(app):
    
    @app.route('/piro')
    def piro_index():
        return send_from_directory('/home/miftah/.antigravity-server/1.Project_Automation/PIRO/dist', 'index.html')

    @app.route('/piro/<path:filename>')
    def piro_static(filename):
        return send_from_directory('/home/miftah/.antigravity-server/1.Project_Automation/PIRO/dist', filename)

    @app.route('/')
    @login_required
    def index():
        return redirect(url_for('dashboard'))

    @app.route('/dashboard')
    @login_required
    def dashboard():
        return render_template('dashboard.html')

    @app.route('/devices')
    @login_required
    def devices_page():
        return render_template('devices.html')

    @app.route('/push-config')
    @login_required
    @role_required('admin', 'operator')
    def push_config_page():
        from app.database import db_session
        devices = db_session.query(Device).all()
        return render_template('push_config.html', devices=devices)

    @app.route('/verification')
    @login_required
    @role_required('admin', 'operator')
    def verification_page():
        return render_template('verification.html')

    @app.route('/remote-access')
    @login_required
    @role_required('admin', 'operator')
    def remote_access_page():
        return render_template('remote_access.html')

    @app.route('/backup')
    @login_required
    def backup_page():
        return render_template('backup.html')

    @app.route('/jobs')
    @login_required
    def jobs_page():
        return render_template('jobs.html')

    @app.route('/users')
    @login_required
    @role_required('admin')
    def users_page():
        return render_template('users.html')

    @app.route('/audit')
    @login_required
    @role_required('admin')
    def audit_page():
        from app.database import db_session
        users = db_session.query(User).all()
        return render_template('audit.html', users=users)

    @app.route('/settings')
    @login_required
    @role_required('admin')
    def settings_page():
        return render_template('settings.html')

    # Error Handlers
    @app.errorhandler(403)
    def forbidden(e):
        return render_template('dashboard.html', error_msg="403 Forbidden"), 403

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('dashboard.html', error_msg="404 Not Found"), 404
