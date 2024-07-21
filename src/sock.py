from flask_socketio import SocketIO, join_room, leave_room, send, emit
from flask import request
import time

from .utils import *
from .oauth import *

socketio = SocketIO(cors_allowed_origins="*", engineio_logger=False,async_mode='gevent')

users : dict[str, User] = {}
rooms : dict[str, Room] = {}

# -------- Join --------

@socketio.on('connect', namespace='/join')
def join_connect():
    userid = getjwt()
    if not userid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)

    print(f"{user.name} connected to /join namespace")

@socketio.on('disconnect', namespace='/join')
def join_disconnect():
    userid = getjwt()
    if not userid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)

    print(f"{user.name} disconnected from /join namespace")

# -------- Room -------- (Web Client)

@socketio.on('connect', namespace='/room')
def room_connect():
    userid = getjwt()
    if not userid: return

    user = users.get(userid)

    print(f"{user.name} connected to /room namespace")

@socketio.on('handle_join_room', namespace='/room')
def handle_join_room(userid: str, roomid: str):
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

@socketio.on('handle_message', namespace='/room')
def handle_message(roomid: str, messagedict: dict):
    message = Message(**messagedict)
    rooms[roomid].chat.append(message)
    socketio.emit('new_message',messagedict,namespace='/room', to=roomid)

@socketio.on('handle_search_song', namespace='/room')
def handle_search_song(userid: str, query: str):
    user = users.get(userid)
    if not user: return
        
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

    socketio.emit('search_results',songs,to=request.sid,namespace='/room')

@socketio.on('handle_song_url',namespace='/room')
@socketio.on('handle_add_song',namespace='/room')
def handle_new_song(userid: str, roomid: str, songid_or_url : str):
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

@socketio.on('disconnect', namespace='/room')
def room_disconnect():
    userid = getjwt()

    if not userid: return   # Sostituire con un redirect alla pagina home

    user = users.get(userid)

    # Forse questo puo' creare problemi
    if not user or not user.room: return

    room = user.room

    leave_room(room.id)
    room.members.remove(user)
    room.num_members -= 1
    socketio.emit('update_member_count',room.asdict(),namespace='/join')
    socketio.emit('member_leave',user.asdict(),namespace='/room',to=room.id)
    user.room = None

    if room.creator.id != user.id: return

    def room_scheduled_removal(creator : User, room : Room):
        time.sleep(5)

        if creator in room.members: return

        socketio.emit('del_room',room.id,namespace='/join')
        socketio.emit('del_room',namespace='/room',to=room.id)
        if room.id in rooms: rooms.pop(room.id)

    socketio.start_background_task(room_scheduled_removal,user,room)

    print(f"{user.name} disconnected from room '{room.name}' created by {room.creator.name}")

# -------- Room -------- (Spotify Client)

@socketio.on('handle_start_playback',namespace='/room')
def handle_start_playback(roomid: str, songid : str):
    userid = getjwt()

    if not userid: return # Sostituire con un redirect alla pagina home

    room = rooms.get(roomid)

    if not room: return

    for user in room.members:
        try:
            client = get_client(user.token)
            if not client: continue
    
            available_devices = list(filter(lambda device: not device['is_restricted'],client.devices()['devices']))
    
            active_devices = list(filter(lambda device: device['is_active'],available_devices))

            if len(active_devices) > 0:
                client.start_playback(device_id=active_devices[0]['id'], uris=[f"spotify:track:{songid}"])
            elif len(available_devices) > 0:
                client.start_playback(device_id=available_devices[0]['id'],uris=[f"spotify:track:{songid}"])
        except spotipy.exceptions.SpotifyException:
            socketio.emit('syncify-spicetify-play',songid)
        
    socketio.emit('update_playpause_button',namespace='/room',to=roomid)

@socketio.on('handle_stop_playback',namespace='/room')
def handle_stop_playback(roomid: str):
    userid = getjwt()

    if not userid: return # Sostituire con un redirect alla pagina home

    room = rooms.get(roomid)

    if not room: return

    for user in room.members:
        try:
            client = get_client(user.token)
            if not client: continue
    
            available_devices = list(filter(lambda device: not device['is_restricted'],client.devices()['devices']))
    
            active_devices = list(filter(lambda device: device['is_active'],available_devices))

            if len(active_devices) > 0:
                client.pause_playback(device_id=active_devices[0]['id'])
            elif len(available_devices) > 0:
                client.pause_playback(device_id=available_devices[0]['id'])
        except spotipy.exceptions.SpotifyException:
            socketio.emit('syncify-spicetify-stop')

    socketio.emit('update_playpause_button',namespace='/room',to=roomid)

@socketio.on('handle_skip_playback',namespace='/room')
def handle_skip_playback(roomid: str, songid : str):
    userid = getjwt()

    if not userid: return # Sostituire con un redirect alla pagina home

    room = rooms.get(roomid)

    if not room: return

    room.history.append(room.queue[0])
    room.queue.pop(0)

    for user in room.members:
        try:
            client = get_client(user.token)
            if not client: continue

            available_devices = list(filter(lambda device: not device['is_restricted'],client.devices()['devices']))

            active_devices = list(filter(lambda device: device['is_active'],available_devices))

            if len(active_devices) > 0:
                client.next_track(device_id=active_devices[0]['id'])
            elif len(available_devices) > 0:
                client.next_track(device_id=available_devices[0]['id'])
        except spotipy.exceptions.SpotifyException:
            socketio.emit('syncify-spicetify-play',songid)

@socketio.on('handle_back_playback',namespace='/room')
def handle_back_playback(roomid: str):
    userid = getjwt()

    if not userid: return # Sostituire con un redirect alla pagina home

    room = rooms.get(roomid)

    if not room: return

    if len(room.history) == 0: return

    lastsong = room.history[-1]
    room.queue.pop(0)
    room.history.append(lastsong)
    room.queue.insert(0,lastsong)

    socketio.emit('new_song',lastsong.asdict(),namespace='/room',to=roomid)

    for user in room.members:
        try:
            client = get_client(user.token)
            if not client: continue

            available_devices = list(filter(lambda device: not device['is_restricted'],client.devices()['devices']))

            active_devices = list(filter(lambda device: device['is_active'],available_devices))

            if len(active_devices) > 0:
                client.previous_track(device_id=active_devices[0]['id'])
            elif len(available_devices) > 0:
                client.previous_track(device_id=available_devices[0]['id'])
        except spotipy.exceptions.SpotifyException:
            socketio.emit('syncify-spicetify-play',lastsong.id)