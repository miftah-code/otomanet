from gevent import monkey
monkey.patch_all()

from flask import Flask
from config import settings
from app.database import init_db
from utils.auth import login_manager
from app.extensions import socketio
from app.api.auth import auth_bp
from app.api.users import users_bp
from app.api.audit import audit_bp
from app.api.jobs import jobs_bp
from app.api.devices import devices_bp
from app.api.health import health_bp
from app.api.verification import verification_bp
from app.api.backups import backups_bp
from app.api.remote import remote_bp
from app.routes import register_routes
import os

def create_app():
    app = Flask(__name__, 
                static_folder='static',
                template_folder='templates')
    
    app.config['SECRET_KEY'] = settings.SECRET_KEY or os.urandom(24)
    app.config['SQLALCHEMY_DATABASE_URI'] = settings.DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Extensions
    login_manager.init_app(app)
    socketio.init_app(app)
    init_db() # Create tables if not exists

    from app.database import db_session
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(users_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(devices_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(verification_bp)
    app.register_blueprint(backups_bp)
    app.register_blueprint(remote_bp)
    
    # Register Pages
    register_routes(app)

    return app

app = create_app()

if __name__ == "__main__":
    # Use socketio.run instead of app.run for WebSocket support
    # Explicitly set log_output to True for debugging
    socketio.run(app, host="0.0.0.0", port=8000, debug=True)
