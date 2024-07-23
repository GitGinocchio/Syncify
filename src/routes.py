from flask_jwt_extended import create_access_token, get_jwt_identity
from flask import Blueprint, render_template, make_response, redirect, request, session

from .utils import *
from .oauth import *
from .sock import users, rooms, socketio

blueprint = Blueprint("blueprint", __name__)

@blueprint.route('/')
def index():
    if hasuserid():
        return redirect('/user')
    else:
        return redirect('/login')

@blueprint.route('/login')
def login():
    return render_template('login.html')

@blueprint.route('/auth')
def auth(): 
    return redirect(Oauth.get_authorize_url())

@blueprint.route('/api/spotify/v1/endpoint')
def callback():
    code = request.args.get("code")
    token = get_token(code)
    client = get_client(token)
    current_user = client.current_user()

    try:
        client.queue()
    except spotipy.SpotifyException:
        product = 'free'
    else:
        product = 'premium'

    if current_user is not None:

        if current_user['id'] not in users:
            user = User()
            user.token = token
            user.product = product
            user.id = current_user['id']
            user.name = current_user['display_name']
            user.url = current_user['external_urls']['spotify']
            user.devices = [Device(**device_info) for device_info in client.devices()['devices']]
            user.current_device = user.devices[0]

            if not len(current_user['images']) > 0:
                user.image = f"https://ui-avatars.com/api/?name={user.name}&length=1&color=000000&background=1ed760&bold=true"
            else:
                user.image = current_user['images'][0]['url']

            users[user.id] = user
            session['userid'] = user.id
        else:
            session['userid'] = current_user['id']
        
        access_token = create_access_token(identity=current_user['id'])
        response = make_response(redirect('/user'))
        response.set_cookie('user_access_token', access_token, max_age=86400, secure=True, httponly=True,samesite='Strict')  #24 ore
        return response
    else:
        return redirect('/')

@blueprint.route("/user")
@useridrequired
def user():
    return render_template('user.html',user=users[session['userid']])

@blueprint.route("/new",methods=["POST","GET"])
@useridrequired
def new():
    user = users[session['userid']]
    if request.method == 'POST':
        if user.room and user.room.id in rooms:
            rooms.pop(user.room.id)
        user.room = None

        name = request.form.get('name',"[name]")
        userlimit = int(request.form.get('userlimit',5))
        editablequeue = request.form.get('editablequeue',False)
        visibility = request.form.get('visibility',"public")
        
        room = Room(
            name=name,
            userlimit=userlimit,
            creator=user,
            visibility=visibility,
            editablequeue=True if editablequeue else False
            )
        user.room = room
        rooms[room.id] = room
        session['roomid'] = room.id
        
        if room.visibility == "public":
            socketio.emit('add_room',room.asdict(),namespace='/join')

        room_access_token = create_access_token(identity=room.id)
        response = make_response(redirect('/room'))
        response.set_cookie('room_access_token', room_access_token,max_age=86400, secure=True, httponly=True,samesite='Strict')
        return response
    else:
        if user.room: return redirect('/user')

        return render_template('new.html',user=user)
    
@blueprint.route("/join",methods=["POST","GET"])
@useridrequired
def join():
    userid = getuserid()
    
    user = users[userid]
    if request.method == 'POST':
        roomid = request.form.get('room')

        room_access_token = create_access_token(identity=roomid)
        response = make_response(redirect('/room'))
        response.set_cookie('room_access_token', room_access_token, secure=True, httponly=True,samesite='Strict')
        return response
    else:
        if user.room: return redirect('/user')
        
        return render_template(
            'join.html',
            user=user,
            rooms=dict(filter(
                lambda item: item[1].visibility == 'public', 
                rooms.items()))
        )

@blueprint.route("/room")
@useridrequired
@roomidrequired
def room():
    userid = getuserid()
    roomid = getroomid()
    if roomid and roomid not in rooms:
        return redirect('/user')

    return render_template('room.html',user=users[userid], room=rooms[roomid])

@blueprint.route("/room/leave")
@useridrequired
@roomidrequired
def leave():
    response = make_response(redirect('/'))
    response.set_cookie('room_access_token', '',expires=0)
    return response

@blueprint.route('/logout')
@useridrequired
def logout():
    userid = getuserid()
    roomid = getroomid()
    
    user = users[userid]
    
    if roomid and user.room:
        if rooms[roomid].creator == user:
            user.room = None
            rooms.pop(roomid)
            socketio.emit('del_room',rooms[roomid],namespace='/join')
        else:
            rooms[roomid].members.remove(user)
            rooms[roomid].num_members -= 1
            socketio.emit('update_member_count',rooms[roomid].asdict(),namespace='/join')
            
    users.pop(userid)
    session.clear()
    
    response = make_response(redirect('/'))
    response.set_cookie('user_access_token', '', expires=0)
    response.set_cookie('room_access_token', '', expires=0)

    return response