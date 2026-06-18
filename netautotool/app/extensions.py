from flask_socketio import SocketIO
from config import settings

socketio = SocketIO(cors_allowed_origins="*", async_mode='gevent', message_queue=settings.REDIS_URL)
