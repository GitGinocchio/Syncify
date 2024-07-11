from flask_socketio import SocketIO, join_room, leave_room, send, emit
from flask import request
import time

from .utils import *
from .oauth import *

socketio = SocketIO(cors_allowed_origins="*", engineio_logger=False,ping_timeout=30)

REFRESH_TIME_LIMIT = 10

users : dict[str, User] = {}
rooms : dict[str, Room] = {}

# -------- Join --------

@socketio.on('connect', namespace='/join')
def join_connect():
    print("Client connected to /join namespace")

@socketio.on('disconnect', namespace='/join')
def join_disconnect():
    print("Client disconnected from /join namespace")

# -------- Room --------

@socketio.on('connect', namespace='/room')
def room_connect():
    userid = request.args.get('userid')
    roomid = request.args.get('roomid')
    user = users.get(userid)
    room = rooms.get(roomid)

    if not room or not user: return

    join_room(roomid)

    if user in room.members: return

    user.room = room
    room.members.append(user)
    room.num_members += 1

    socketio.emit('update_member_count',room.asdict(),namespace='/join')
    socketio.emit('member_join',user.asdict(),namespace='/room',to=roomid)
    print("Client connected to /room namespace")

@socketio.on('handle_message', namespace='/room')
def handle_message(message_data):
    roomid = request.args.get('roomid')
    message = Message(**message_data)
    rooms[roomid].chat.append(message)
    socketio.emit('new_message',message_data,namespace='/room', to=roomid)

@socketio.on('handle_search_song', namespace='/room')
def handle_search_song(query : str):
    userid = request.args.get('userid')
    roomid = request.args.get('roomid')
    
    user = users.get(userid)
    if not user or not roomid: return
        
    client = get_client(user.token)
    if not client: return
    
    tracks_info = client.search(query)['tracks']['items']
    
    songs = []
    for track in tracks_info:
        track['album'].pop('artists')
        track['album'].pop('release_date_precision')

        minutes = track['duration_ms'] // 60000
        seconds = (track['duration_ms'] % 60000) // 1000
        duration = f"{minutes}:{seconds:02}"

        song = Song(
                    id=track['id'],
                    url=track['external_urls']['spotify'],
                    album=track['album'],
                    popularity=track['popularity'],
                    name=track['name'],
                    duration=duration,
                    duration_ms=track['duration_ms'],
                    artists=track['artists'],
                    preview_url=track['preview_url']
                   )
        songs.append(song.asdict())

    socketio.emit('search_results',songs,namespace='/room',to=request.sid)

@socketio.on('handle_song_url',namespace='/room')
@socketio.on('handle_add_song',namespace='/room')
def handle_add_song(songid_or_url : str):
    userid = request.args.get('userid')
    roomid = request.args.get('roomid')

    user = users.get(userid)
    room = rooms.get(roomid)

    if not user or not room: return

    client = get_client(user.token)
    track = client.track(songid_or_url)

    if not track: return

    minutes = track['duration_ms'] // 60000
    seconds = (track['duration_ms'] % 60000) // 1000
    duration = f"{minutes}:{seconds:02}"
        
    song = Song(
        id=track['id'],
        url=track['external_urls']['spotify'],
        album=track['album'],
        popularity=track['popularity'],
        name=track['name'],
        duration_ms=track['duration_ms'],
        duration=duration,
        artists=track['artists'],
        preview_url=track['preview_url'],
        addedby=user
       )
    room.queue.append(song)
    socketio.emit('new_song',song.asdict(),namespace='/room',to=roomid)

    if len(room.queue) == 1:
        socketio.emit('set_current_song_details',song.asdict(),namespace='/room',to=roomid)

@socketio.on('handle_start_playback',namespace='/room')
def handle_start_playback(songid : str):
    roomid = request.args.get('roomid')
    room = rooms.get(roomid)

    if not room: return

    for user in room.members:
        client = get_client(user.token)
        if not client: continue

        available_devices = list(filter(lambda device: not device['is_restricted'],client.devices()['devices']))

        active_devices = list(filter(lambda device: device['is_active'],available_devices))

        try:
            if len(active_devices) > 0:
                client.start_playback(device_id=active_devices[0]['id'], uris=[f"spotify:track:{songid}"])
            else:
                client.start_playback(device_id=available_devices[0]['id'],uris=[f"spotify:track:{songid}"])
        except spotipy.exceptions.SpotifyException as e:
            print(e)

@socketio.on('handle_stop_playback',namespace='/room')
def handle_stop_playback():
    pass

""" Implementazione futura...
@socketio.on('handle_room_deletion_request')
def handle_room_deletion_request():
    pass
"""

@socketio.on('disconnect', namespace='/room')
def room_disconnect():
    userid = request.args.get('userid')
    user = users.get(userid)

    # Forse questo puo' creare problemi
    if not user or not user.room: return

    room = user.room

    leave_room(room.id)

    if room.creator == user:
        socketio.emit('del_room',room.id,namespace='/join')
        socketio.emit('del_room',namespace='/room',to=room.id)
        rooms.pop(room.id)
    else:
        room.members.remove(user)
        room.num_members -= 1
        socketio.emit('update_member_count',room.asdict(),namespace='/join')
        socketio.emit('member_leave',user.asdict(),namespace='/room',to=room.id)
    user.room = None
    print("Client disconnected from /room namespace")