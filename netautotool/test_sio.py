import socketio
import time

sio = socketio.Client(logger=True, engineio_logger=True)

@sio.event
def connect():
    print("Connected!")
    sio.emit('connect_terminal', {'device_id': 1})

@sio.on('terminal_output')
def on_message(data):
    print("Output:", data)

sio.connect('http://localhost:8000', transports=['websocket'])
time.sleep(5)
sio.disconnect()
