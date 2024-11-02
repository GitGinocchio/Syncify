from SyncifyWeb.utils.terminal import getlogger
from flask_socketio import SocketIO

logger = getlogger()

def myevent():
    print('ciao')





def setup(socketio : SocketIO):
    socketio.on_event("myevent",myevent)