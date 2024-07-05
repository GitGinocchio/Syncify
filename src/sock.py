from flask_socketio import SocketIO, join_room, leave_room, send, emit

from .utils import *

socketio = SocketIO(cors_allowed_origins="*", engineio_logger=True)

shared = {'rooms' : {}}

@socketio.on('connect', namespace='/join')
def connect_to_join():
    emit('connected')

@socketio.on('connect', namespace='/room')
def connect_to_room():
    emit('connected')

@socketio.on('handle_message', namespace='/room')
def handle_message(data):
    roomid = data['roomid']
    message = Message(data['username'],data['userimage'],data['userurl'],data['userid'],data['message'])
    shared['rooms'][roomid].chat.append(message)
    socketio.emit('refresh_room',namespace='/room')