from flask_socketio import SocketIO, join_room, leave_room, close_room, send, emit
from flask import request, make_response
import time

from Syncify.utils.terminal import getlogger
from Syncify.utils.classes import *
from Syncify.oauth import *

logger = getlogger()

socketio = SocketIO(cors_allowed_origins="*", engineio_logger=logger,async_mode='gevent')

users : dict[str, User] = {}
rooms : dict[str, Room] = {}

# -------- User --------

@socketio.on('connect',namespace='/user')
def user_connect():
    userid = getuserid()
    if not userid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)
    logger.info(f"User {userid} connected to /user namespace")

@socketio.on('disconnect',namespace='/user')
def user_disconnect():
    userid = getuserid()
    if not userid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)

    logger.info(f"{user.name} disconnected from /user namespace")

# -------- Join --------

@socketio.on('connect', namespace='/join')
def handle_join_connect():
    userid = getuserid()
    if not userid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)

    logger.info(f"{user.name} connected to /join namespace")

@socketio.on('disconnect', namespace='/join')
def handle_join_disconnect():
    userid = getuserid()
    if not userid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)

    logger.info(f"{user.name} disconnected from /join namespace")

# -------- Room -------- (Web Client)

@socketio.on('connect', namespace='/room')
def handle_room_connect():
    userid = getuserid()
    roomid = getroomid()

    if not userid: return                                          # Sostituire con un redirect alla pagina home

    user = users.get(userid)
    room = rooms.get(roomid)

    if not room or not user: return

    join_room(roomid)

    if len(room.queue) > 0 and room.status == 'playing':
        nextsong = room.queue[0]


        if user.client_sid:
            socketio.emit(
                'syncify-spicetify-play',
                (nextsong.id,time.time() - room.song_started_at + (room.song_paused_at if room.song_paused_at else 0)), 
                namespace='/client',
                to=user.client_sid
            )

        socketio.emit('update_playpause_button',room.status,namespace='/room',to=roomid)
    
    if len(room.queue) > 0:
        nextsong = room.queue[0]

        socketio.emit('set_update_progress_bar',(room.song_started_at,room.song_paused_at,nextsong.duration_ms), namespace='/room',to=roomid)
        socketio.emit('set_current_song_details',nextsong.asdict(),namespace='/room',to=roomid)
    
    if user in room.members: return

    user.room = room
    room.members.append(user)
    room.num_members += 1

    socketio.emit('member_join',user.asdict(),namespace='/room',to=roomid)
    socketio.emit('update_member_count',room.asdict(),namespace='/join')

    logger.info(f"{user.name} connected to /room namespace")

@socketio.on('handle_message', namespace='/room')
def handle_message(text : str):
    userid = getuserid()
    roomid = getroomid()

    if not userid or not roomid: return # Sostituire con un redirect alla pagina home
    user = users.get(userid)
    room = rooms.get(roomid)
    if not user or not room: return

    message = Message(sender=user,text=text)
    room.chat.append(message)
    socketio.emit('new_message',(message.asdict(), request.sid), namespace='/room', to=roomid)

@socketio.on('handle_search_song', namespace='/room')
def handle_search_song(query: str):
    userid = getuserid()

    if not userid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)
    if not user: return
    
    tracks_info : list[dict]= spotify.search(query)['tracks']['items']
    
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
                    preview_url=track.get('preview_url') # Key Error, preview url not always present
                   )
        songs.append(song.asdict())

    socketio.emit('search_results',songs,to=request.sid,namespace='/room')

@socketio.on('handle_song_url',namespace='/room')
@socketio.on('handle_add_song',namespace='/room')
def handle_new_song(songid : str):
    userid = getuserid()
    roomid = getroomid()
    
    if not userid or not roomid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)
    room = rooms.get(roomid)

    if not user or not room: return

    track = spotify.track(songid)

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
        preview_url=track.get('preview_url'),   # Key Error, preview url not always present
        addedby=user
       )
    room.queue.append(song)
    socketio.emit('add_song',('queue',song.asdict(),-1),namespace='/room',to=roomid)

    if len(room.queue) == 1:
        socketio.emit('set_current_song_details',song.asdict(),namespace='/room',to=roomid)

"""
@socketio.on('handle_progress_request',namespace='/room')
def handle_progress_request():
    roomid = getroomid()

    if not roomid: return

    room = rooms.get(roomid)

    if not room: return

    socketio.emit('current_progress', room.song_started_at, room.song_paused_at,to=request.sid)
"""

@socketio.on('disconnect', namespace='/room')
def handle_room_disconnect():
    userid = getuserid()

    if not userid: return                           # Sostituire con un redirect alla pagina home

    user = users.get(userid)

    if not user or not user.room: return            # Forse questo puo' creare problemi

    room = user.room

    if user.client_sid:
        socketio.emit('syncify-spicetify-stop', namespace='/client',to=user.client_sid)

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

        #close_room(room.id)
        if room.id in rooms: rooms.pop(room.id)

        logger.info(f"Room '{room.name}' created by {room.creator.name} deleted")

        for member in room.members:
            if member.client_sid:
                socketio.emit('syncify-spicetify-deleted-room',namespace='/client',to=member.client_sid)

    socketio.start_background_task(room_scheduled_removal,user,room)
    
    logger.info(f"{user.name} disconnected from room '{room.name}' created by {room.creator.name}")

# -------- Room -------- (Spotify Client)

@socketio.on('register_spotify_client',namespace='/spotifyclient')
def register_spotify_client(userid: str, access_token : str, exp : str):
    user = users.get(userid)

    print(userid, access_token,  exp)

    if not user:
        token = Token(access_token,exp)
        client = get_client(token)
        user_info = client.current_user()

        user = User(
            name=user_info['display_name'],
            id=user_info['id'],
            url=user_info['external_urls']['spotify'],
            image=user_info['images'][0]['url'],
            token=Token
        )

        users[user.id] = user
    
    client = Client(str(request.sid))
    user.clients[client.sid] = client

    socketio.emit('syncify-spicetify-send-challenge',(user.id, client.challenge.id.hex), namespace='/spotifyclient', to=request.sid)

    """
    room = user.room

    if room and len(room.queue) > 0 and room.status == 'playing':
        nextsong = room.queue[0]
        socketio.emit('syncify-spicetify-registered',(nextsong.id,time.time() - room.song_started_at + (room.song_paused_at if room.song_paused_at else 0)), namespace='/spotifyclient',to=request.sid)
    else:
        socketio.emit('syncify-spicetify-registered', namespace='/spotifyclient',to=request.sid)
    """

@socketio.on('handle_start_playback',namespace='/room')
def handle_start_playback():
    userid = getuserid()
    roomid = getroomid()

    if not userid or not roomid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)
    room = rooms.get(roomid)

    if not user or not room: return

    if len(room.queue) == 0: return
    
    nextsong = room.queue[0]

    room.status = 'playing'
    if not room.song_started_at:
        room.song_started_at = time.time()
    elif room.song_paused_at:
        room.song_started_at += time.time() - room.song_paused_at
    room.song_paused_at = None

    for member in room.members:
        if not member.client_sid: continue
        socketio.emit(
            'syncify-spicetify-play',
            (nextsong.id,time.time() - room.song_started_at + (room.song_paused_at if room.song_paused_at else 0)), 
            namespace='/spotifyclient',
            to=member.client_sid
        )
        
    socketio.emit('update_playpause_button',room.status,namespace='/room',to=roomid)
    socketio.emit('set_update_progress_bar',(room.song_started_at,room.song_paused_at,nextsong.duration_ms), namespace='/room',to=roomid)

@socketio.on('handle_stop_playback',namespace='/room')
def handle_stop_playback():
    userid = getuserid()
    roomid = getroomid()

    if not userid or not roomid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)
    room = rooms.get(roomid)

    if not user or not room: return

    room.status = 'idle'
    room.song_paused_at = time.time()

    for member in room.members:
        socketio.emit('syncify-spicetify-stop', namespace='/spotifyclient',to=member.client_sid)

    socketio.emit('update_playpause_button',room.status,namespace='/room',to=roomid)
    socketio.emit('unset_update_progress_bar',namespace='/room',to=roomid)

@socketio.on('handle_skip_playback',namespace='/room')
def handle_skip_playback():
    userid = getuserid()
    roomid = getroomid()

    if not userid or not roomid: return                # Sostituire con un redirect alla pagina home

    user = users.get(userid)
    room = rooms.get(roomid)

    if not user or not room: return

    room.song_started_at = time.time()
    room.song_paused_at = None

    if len(room.queue) == 0:             # Se non esistono canzoni nella queue
        room.status = 'idle'                 # Imposta lo stato della stanza in idle

    if room.status == 'playing':         # Se lo stato della stanza e' playing
        lastplayed = room.queue.pop(0)       # Ottengo e tolgo dalla queue la prima canzone
        room.history.insert(0,lastplayed)    # Inserisco la canzone nella history

        socketio.emit('del_song',0,namespace='/room',to=roomid)
        socketio.emit('add_song',('history',lastplayed.asdict(),0),namespace='/room',to=roomid)

    if len(room.queue) == 0:             # Se dopo aver saltato la canzone non ce ne sono altre non si riproduce altro
        room.status = 'idle'                # Imposta lo stato della stanza in idle

    if room.status == 'idle':
        for member in room.members:
            socketio.emit('syncify-spicetify-stop', namespace='/spotifyclient',to=member.client_sid)

        socketio.emit('update_playpause_button',namespace='/room',to=roomid)
        socketio.emit('set_current_song_details',namespace='/room',to=roomid)
        socketio.emit('unset_update_progress_bar',namespace='/room',to=roomid)
        socketio.emit('reset_progress_bar',namespace='/room',to=roomid)
        return

    nextsong = room.queue[0]             # Ottengo la prossima canzone presente nella queue

    for member in room.members:
        socketio.emit('syncify-spicetify-play',(nextsong.id,0), namespace='/spotifyclient',to=member.client_sid)

    socketio.emit('set_current_song_details',nextsong.asdict(),namespace='/room',to=roomid)
    socketio.emit('reset_progress_bar',namespace='/room',to=roomid)
    socketio.emit('set_update_progress_bar',(room.song_started_at,room.song_paused_at,nextsong.duration_ms), namespace='/room',to=roomid)

@socketio.on('handle_back_playback',namespace='/room')
def handle_back_playback():
    userid = getuserid()
    roomid = getroomid()

    if not userid or not roomid: return # Sostituire con un redirect alla pagina home

    user = users.get(userid)
    room = rooms.get(roomid)

    if not user or not room: return

    room.song_started_at = time.time()
    room.song_paused_at = None

    if len(room.history) == 0:            # Se non esiste una canzone gia' ascoltata ritorna
        room.status = 'idle'

        for member in room.members:
            socketio.emit('syncify-spicetify-stop', namespace='/client',to=member.client_sid)
        
        socketio.emit('update_playpause_button',room.status,namespace='/room',to=roomid)
        socketio.emit('set_current_song_details',namespace='/room',to=roomid)
        socketio.emit('unset_update_progress_bar',namespace='/room',to=roomid)
        socketio.emit('reset_progress_bar',namespace='/room',to=roomid)
        return
    
    lastplayed = room.history[0]         # Prendo l'ultima canzone ascoltata dalla history ma non la tolgo

    if len(room.queue) > 0:               # Se esiste una canzone attuale nella coda
        currentsong = room.queue.pop(0)       # Prendo la canzone attuale e la tolgo dalla coda
        room.history.insert(0,currentsong)    # Inserisco la canzone attuale nella history
        
        socketio.emit('del_song',0,namespace='/room',to=roomid)
        socketio.emit('add_song',('history',currentsong.asdict(),0),namespace='/room',to=roomid)

    room.queue.insert(0,lastplayed)       # Inserisco come prossima canzone nella queue l'ultima canzone ascoltata

    socketio.emit('add_song',('queue',lastplayed.asdict(),0),namespace='/room',to=roomid) # Aggiungere la canzone come primo elemento e non alla fine della coda

    for member in room.members:
        socketio.emit('syncify-spicetify-play',(lastplayed.id,0), namespace='/spotifyclient',to=member.client_sid)

    socketio.emit('set_current_song_details',lastplayed.asdict(),namespace='/room',to=roomid)
    socketio.emit('update_playpause_button',room.status,namespace='/room',to=roomid)
    socketio.emit('reset_progress_bar',namespace='/room',to=roomid)
    socketio.emit('set_update_progress_bar',(room.song_started_at,room.song_paused_at,lastplayed.duration_ms), namespace='/room',to=roomid)