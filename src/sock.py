from flask_socketio import SocketIO, join_room, leave_room, send, emit

from .utils import *

socketio = SocketIO(cors_allowed_origins="*", engineio_logger=True)

users = {}
rooms = {}

@socketio.on('connect', namespace='/join')
def join_connect():
    print("Client connected to /join namespace")

@socketio.on('disconnect', namespace='/join')
def join_disconnect():
    print("Client disconnected from /join namespace")

@socketio.on('connect', namespace='/room')
def room_connect():
    print("Client connected to /room namespace")

@socketio.on('disconnect', namespace='/room')
def room_disconnect():
    print("Client disconnected from /room namespace")

@socketio.on('handle_message', namespace='/room')
def handle_message(message_data, roomid):
    message = Message(**message_data)
    rooms[roomid].chat.append(message)
    socketio.emit('new_message',message_data,namespace='/room')