from celery import Celery
from config import settings

celery_app = Celery(
    "otomanet_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['tasks']
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jakarta",
    enable_utc=True,
)

# Add periodic tasks here using celery-beat
celery_app.conf.beat_schedule = {
    "job-scheduler-loop-every-minute": {
        "task": "tasks.job_scheduler_loop",
        "schedule": 60.0, # Every minute
    },
    "auto-backup-daily": {
        "task": "tasks.run_auto_backup",
        "schedule": 3600 * 6, # Every 6 hours
    },
    "check-device-status-every-5-min": {
        "task": "tasks.check_devices_status",
        "schedule": 300, # Every 5 minutes
    },
    "health-check-every-1-min": {
        "task": "tasks.health_check_all",
        "schedule": 60.0, # Every minute
    }
}
