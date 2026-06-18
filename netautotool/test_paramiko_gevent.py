from gevent import monkey
monkey.patch_all()

import paramiko
import sys
import gevent

def test_ssh():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    # Assuming there's a local SSH server or we can just try to connect to localhost
    try:
        ssh.connect('127.0.0.1', username='miftah', password='password', timeout=2)
        print("Connected!")
    except Exception as e:
        print("Error:", e)

test_ssh()
