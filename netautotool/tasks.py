from celery_app import celery_app
from core.device_manager import DeviceManager
from app.database import SessionLocal
import os
from datetime import datetime, timedelta
import pytz
from utils.logger import get_logger
import socket
import time
import json

logger = get_logger("celery_tasks")
JAKARTA_TZ = pytz.timezone('Asia/Jakarta')

# Path discovery that works everywhere
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_BASE = os.path.join(BASE_DIR, "backup")
REPORT_BASE = os.path.join(BASE_DIR, "reports")

# Ensure directories exist
os.makedirs(BACKUP_BASE, exist_ok=True)
os.makedirs(REPORT_BASE, exist_ok=True)

@celery_app.task(name="tasks.run_auto_backup")
def run_auto_backup():
    db = SessionLocal()
    try:
        manager = DeviceManager(db)
        devices = manager.list_devices()
        timestamp = datetime.now(JAKARTA_TZ).strftime("%Y%m%d_%H%M%S")
        
        results = {"success": 0, "failed": 0}
        for device in devices:
            res = manager.get_config(device.id)
            if res["success"]:
                filename = f"{device.hostname}_{timestamp}.cfg"
                with open(os.path.join(BACKUP_BASE, filename), "w") as f:
                    f.write(res["config"])
                results["success"] += 1
            else:
                results["failed"] += 1
        return f"Backup: {results['success']} success, {results['failed']} failed."
    finally:
        db.close()

@celery_app.task(name="tasks.backup_single_device")
def backup_single_device(device_id: int):
    db = SessionLocal()
    try:
        manager = DeviceManager(db)
        device = manager.get_device(device_id)
        if not device: return {"success": False, "error": "Device not found"}
        
        timestamp = datetime.now(JAKARTA_TZ).strftime("%Y%m%d_%H%M%S")
        res = manager.get_config(device_id)
        if res["success"]:
            filename = f"{device.hostname}_{timestamp}.cfg"
            with open(os.path.join(BACKUP_BASE, filename), "w") as f:
                f.write(res["config"])
            return {"hostname": device.hostname, "success": True, "file": filename}
        else:
            return {"hostname": device.hostname, "success": False, "error": res.get("error")}
    finally:
        db.close()

@celery_app.task(name="tasks.manual_backup_task")
def manual_backup_task(device_ids: list):
    results = []
    for d_id in device_ids:
        res = backup_single_device(d_id)
        results.append(res)
    return results

@celery_app.task(name="tasks.verify_config_task")
def verify_config_task(device_id: int, expected_commands: list):
    db = SessionLocal()
    try:
        manager = DeviceManager(db)
        device = manager.get_device(device_id)
        if not device: return {"success": False, "error": "Device not found"}
        
        now = datetime.now(JAKARTA_TZ)
        timestamp_str = now.strftime("%Y%m%d_%H%M%S")
        report_filename = f"verify_{device.hostname}_{timestamp_str}.txt"
        report_path = os.path.join(REPORT_BASE, report_filename)
        
        res = manager.get_config(device_id)
        if not res["success"]:
            return {"success": False, "error": res.get("error")}
            
        config_content = res.get("config", "")
        
        report_lines = [
            f"OTOMANET VERIFICATION REPORT - {device.hostname}",
            f"Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}",
            "-"*40,
            "CHECKLIST:"
        ]
        
        passed_count = 0
        for cmd in expected_commands:
            if cmd in config_content:
                status = "[ PASS ]"
                passed_count += 1
                report_lines.append(f"{status} {cmd} (Found in Config)")
            else:
                exec_output = manager.execute_command(device_id, cmd)
                if exec_output and "Error" not in exec_output and "% Invalid" not in exec_output:
                    status = "[ PASS ]"
                    passed_count += 1
                    report_lines.append(f"{status} {cmd} (Executed Successfully)")
                    report_lines.append(f"Output:\n{exec_output}\n")
                else:
                    status = "[ FAIL ]"
                    report_lines.append(f"{status} {cmd}")
                    if "Error" in exec_output:
                        report_lines.append(f"Reason: {exec_output}")

        report_lines.append("-"*40)
        report_lines.append(f"Result: {passed_count}/{len(expected_commands)} passed.")
        
        output_text = "\n".join(report_lines)
        with open(report_path, "w") as f:
            f.write(output_text)
            
        return {
            "success": True, 
            "filename": report_filename, 
            "report_path": report_path,
            "output": output_text
        }
    except Exception as e:
        logger.error(f"Verification Task Error: {e}")
        return {"success": False, "error": str(e)}
    finally:
        db.close()

@celery_app.task(name="tasks.check_devices_status")
def check_devices_status():
    db = SessionLocal()
    try:
        manager = DeviceManager(db)
        for device in manager.list_devices():
            manager.test_connection(device.id)
        return "Status check completed."
    finally:
        db.close()

@celery_app.task(name="tasks.health_check_all")
def health_check_all():
    db = SessionLocal()
    try:
        from models.device import Device
        devices = db.query(Device).all()
        for device in devices:
            try:
                start_time = time.time()
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2)
                result = s.connect_ex((device.ip_address, device.port or 22))
                end_time = time.time()
                
                if result == 0:
                    ping_ms = int((end_time - start_time) * 1000)
                    device.last_ping_ms = ping_ms
                    device.health_status = "UP" if ping_ms < 200 else "SLOW"
                else:
                    device.last_ping_ms = None
                    device.health_status = "DOWN"
                s.close()
            except Exception as e:
                logger.error(f"TCP check error for {device.hostname}: {e}")
                device.health_status = "UNKNOWN"
        db.commit()
        return f"Health check completed for {len(devices)} devices."
    finally:
        db.close()

@celery_app.task(name="tasks.push_config_single_device")
def push_config_single_device(device_id: int, commands: list):
    db = SessionLocal()
    try:
        manager = DeviceManager(db)
        return manager.push_config(device_id, commands)
    finally:
        db.close()

@celery_app.task(name="tasks.run_custom_job_task")
def run_custom_job_task(device_ids: list, commands: list, job_name: str = "Custom Job"):
    db = SessionLocal()
    try:
        manager = DeviceManager(db)
        results = []
        for d_id in device_ids:
            res = manager.push_config(d_id, commands)
            results.append(res)
        
        logger.info(f"Custom Job '{job_name}' completed on {len(device_ids)} devices.")
        return results
    finally:
        db.close()

@celery_app.task(name="tasks.job_scheduler_loop")
def job_scheduler_loop():
    """Periodic task to check and run user-defined jobs."""
    from models.job import JobSchedule
    from croniter import croniter
    
    db = SessionLocal()
    try:
        now = datetime.now(JAKARTA_TZ)
        jobs = db.query(JobSchedule).filter(JobSchedule.is_active == True).all()
        
        for job in jobs:
            should_run = False
            
            if job.job_type == 'ONE_TIME':
                if job.run_at and job.run_at.replace(tzinfo=JAKARTA_TZ) <= now and not job.last_run:
                    should_run = True
            
            elif job.job_type == 'RECURRING':
                if not job.next_run:
                    # First time calculation
                    if job.schedule_type == 'INTERVAL':
                        job.next_run = datetime.now() + timedelta(seconds=int(job.schedule_value))
                    elif job.schedule_type == 'CRON':
                        iter = croniter(job.schedule_value, datetime.now())
                        job.next_run = iter.get_next(datetime)
                
                if job.next_run and job.next_run.replace(tzinfo=JAKARTA_TZ) <= now:
                    should_run = True

            if should_run:
                logger.info(f"Triggering scheduled job: {job.name} ({job.task_type})")
                
                # Trigger the actual task
                kwargs = {}
                if job.task_type == 'BACKUP':
                    run_auto_backup.delay()
                elif job.task_type == 'STATUS_CHECK':
                    check_devices_status.delay()
                elif job.task_type == 'HEALTH_CHECK':
                    health_check_all.delay()
                elif job.task_type == 'CUSTOM':
                    device_ids = json.loads(job.device_ids) if job.device_ids else []
                    commands = job.custom_commands.split('\n') if job.custom_commands else []
                    run_custom_job_task.delay(device_ids, commands, job.name)
                
                # Update job status
                job.last_run = now
                if job.job_type == 'ONE_TIME':
                    job.is_active = False # Completed
                else:
                    # Calculate next run
                    if job.schedule_type == 'INTERVAL':
                        job.next_run = now + timedelta(seconds=int(job.schedule_value))
                    elif job.schedule_type == 'CRON':
                        iter = croniter(job.schedule_value, now)
                        job.next_run = iter.get_next(datetime)
        
        db.commit()
    except Exception as e:
        logger.error(f"Scheduler Loop Error: {e}")
    finally:
        db.close()
