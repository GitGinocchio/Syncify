from flask_jwt_extended import create_access_token, get_jwt_identity
from flask import Blueprint, render_template, make_response, redirect, request, session

from .utils.classes import *
from .oauth import *
from .sock import users, rooms, socketio

blueprint = Blueprint("blueprint", __name__)

@blueprint.route('/')
def index():
    if hasuserid():
        return redirect('/user')
    else:
        return redirect('/login')

@blueprint.route('/onboard')
def onboard():
    return render_template('onboard.html', user=None)

@blueprint.route('/login')
def login():
    return render_template('login.html')

@blueprint.route("/user")
@useridrequired
def user():
    return render_template('user.html',
                           user=users[session['userid']],
                           num_rooms=len(rooms),
                           num_public_rooms=len(dict(filter(lambda item: item[1].visibility == 'public', rooms.items()))))

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
        response.set_cookie('room_access_token', room_access_token, max_age=86400, secure=True, httponly=True,samesite='Strict')
        return response
    else:
        if user.room: return redirect('/user')

        return render_template('new.html',user=user)
    
@blueprint.route("/join",defaults={'roomid': None},methods=["POST","GET"])
@blueprint.route("/join/<roomid>", methods=["GET"])
@useridrequired
def join(roomid):
    userid = getuserid()

    if not userid: return redirect('/')
    
    user = users.get(userid)

    if not user: return redirect('/')
    
    if request.method == 'POST':
        roomid = request.form.get('roomid')
        room = rooms.get(roomid)

        if room.num_members+1 <= room.userlimit:
            session['roomid'] = roomid
            
            room_access_token = create_access_token(identity=roomid)
            response = make_response(redirect('/room'))
            response.set_cookie('room_access_token', room_access_token,max_age=86400, secure=True, httponly=True)
        else:
            response = make_response(redirect('/join'))
        return response
    else:
        if roomid:
            room = rooms.get(roomid)

            if room.num_members+1 <= room.userlimit:
                session['roomid'] = roomid

                room_access_token = create_access_token(identity=roomid)
                response = make_response(redirect('/room'))
                response.set_cookie('room_access_token', room_access_token,max_age=86400, secure=True, httponly=True)
            else:
                response = make_response(redirect('/join'))
            return response
        
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

    if not userid or not roomid: return redirect('/')

    user = users.get(userid)
    room = rooms.get(roomid)

    if not user or not room: return redirect('/')

    return render_template('room.html',user=user, room=room)

@blueprint.route("/room/leave")
@useridrequired
@roomidrequired
def leave():
    response = make_response(redirect('/'))
    response.set_cookie('room_access_token', '',expires=0)
    return response

@blueprint.route("/spotifyclient")
def spotifyclient():
    return redirect('/')

@blueprint.route("/challenge")
def challenge():
    userid = request.args.get('userid')
    code = request.args.get('code')

    user = users.get(userid)

    if not user:  return "403"
    if not code: return "403"

    match : list[Client] = [client for sid, client in user.clients.items() if client.challenge.id.hex == code]
    
    if len(match) == 1:
        client = match[0]

        if client.challenge.id.hex == code and client.challenge.exp > datetime.now(timezone.utc) and client.challenge.status == 'pending':
            client.challenge.status = 'accepted'

            session['userid'] = user.id
            user_access_token = create_access_token(identity=user.id)
            response = make_response(redirect('/user'))
            response.set_cookie('user_access_token', user_access_token, max_age=86400, secure=True, httponly=True,samesite='Strict')  #24 ore
            return response
        elif client.challenge.status == 'accepted':
            return "Account già presente, credenziali corrette."
        else:
            client.challenge.status == 'refused'
            return "Challenge non completata"
    else:
        return "Errore"

@blueprint.route('/logout')
@useridrequired
def logout():
    userid = getuserid()
    roomid = getroomid()
    
    user = users.get(userid)
    
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

@blueprint.route('/bugreport')
def bugreport():
    userid = getuserid()

    user = users.get(userid)

    return render_template('bugreport.html',user=user)
