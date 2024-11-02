from flask_jwt_extended import create_access_token, get_jwt_identity
from flask import Blueprint, render_template, make_response, redirect, request, session

from OldSyncifyWeb.utils.classes import *
from OldSyncifyWeb.oauth import *
from OldSyncifyWeb.sock import users, rooms, challenges, socketio

blueprint = Blueprint("blueprint", __name__)

@blueprint.route('/')
def index_route():
    if hasuserid():
        return redirect('/user')
    else:
        return redirect('/login')

@blueprint.route('/onboard')
def onboard_route():
    return render_template('onboard.html', user=None)

@blueprint.route('/login')
def login_route():
    return render_template('login.html')

@blueprint.route("/user")
@useridrequired
def user_route():
    return render_template('user.html',
                           user=users[session['userid']],
                           num_rooms=len(rooms),
                           num_public_rooms=len(dict(filter(lambda item: item[1].visibility == Room.Visibility.PUBLIC, rooms.items()))))

@blueprint.route("/new",methods=["POST","GET"])
@useridrequired
def new_route():
    userid = getuserid()
    user = users.get(userid)

    if not user: return redirect('/')

    if request.method == 'POST':
        if user.room and user.room.id.hex in rooms:
            rooms.pop(user.room.id.hex)
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
        rooms[room.id.hex] = room
        session['roomid'] = room.id.hex
        
        if room.visibility == "public":
            socketio.emit('add_room',room.asdict(),namespace='/join')

        room_access_token = create_access_token(identity=room.id.hex)
        response = make_response(redirect('/room'))
        response.set_cookie('room_access_token', room_access_token, max_age=86400, secure=True, httponly=True,samesite='Strict')
        return response
    else:
        if user.room: return redirect('/user')

        return render_template('new.html',user=user)
    
@blueprint.route("/join",defaults={'roomid': None},methods=["POST","GET"])
@blueprint.route("/join/<roomid>", methods=["GET"])
@useridrequired
def join_route(roomid):
    userid = getuserid()

    if not userid: return redirect('/')
    
    user = users.get(userid)

    if not user: return redirect('/')
    
    if request.method == 'POST':
        roomid = request.form.get('roomid')
        room = rooms.get(roomid)

        if not room: return redirect('/')

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

            if not room: return redirect('/')

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
                lambda item: item[1].visibility == Room.Visibility.PUBLIC, 
                rooms.items()))
        )

@blueprint.route("/room")
@useridrequired
@roomidrequired
def room_route():
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
def leave_route():
    response = make_response(redirect('/'))
    response.set_cookie('room_access_token', '',expires=0)
    return response

@blueprint.route("/spotifyclient")
def spotifyclient_route():
    return redirect('/')

@blueprint.route("/challenge")
def challenge_route():
    code = request.args.get('code')

    if not code: return render_template('challenge.html', user=None) #return "403"

    challenge = challenges.get(code)
    user = users.get(challenge.userid)

    if not challenge: return render_template('challenge.html', user=None) #return "403"
    if not user: return render_template('challenge.html', user=None) #return "403"
    
    if challenge.id.hex == code and challenge.exp > datetime.now(timezone.utc) and challenge.status == challenge.Status.PENDING:
        challenge.status = challenge.Status.ACCEPTED

        user.clients[challenge.sid] = Client(
            challenge.sid,
            challenge.locale,
            challenge.version,
            challenge.platform,
            challenge.os_name,
            challenge.os_version
        )

        del challenges[challenge.id.hex]
        del challenge

        session['userid'] = user.id
        user_access_token = create_access_token(identity=user.id)
        response = make_response(render_template('challenge.html', user=user))
        response.set_cookie('user_access_token', user_access_token, max_age=86400, secure=True, httponly=True,samesite='Strict')  #24 ore
        # return "Challenge completata con successo, account creato." 
        return response
    elif challenge.status == Challenge.Status.ACCEPTED:
        # return "Account già presente, credenziali corrette." 
        return render_template('challenge.html', user=user)
    else:
        challenge.status == Challenge.Status.REFUSED
        # return "Challenge non completata" 
        return render_template('challenge.html', user=user)

@blueprint.route('/logout')
@useridrequired
def logout_route():
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
def bugreport_route():
    userid = getuserid()

    user = users.get(userid)

    return render_template('bugreport.html',user=user)
