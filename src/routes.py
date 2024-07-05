from flask import Blueprint, render_template, make_response
from hashlib import sha256

from .utils import *
from .oauth import Oauth, get_client, get_token
from .sock import shared, socketio

blueprint = Blueprint("blueprint", __name__)

@blueprint.route('/')
def index():
    if haslogin():
        return redirect('/user')
    else:
        return render_template('login.html')

@blueprint.route('/login')
def login(): 
    return redirect(Oauth.get_authorize_url())

@blueprint.route('/api/spotify/v1/endpoint')
def callback():
    code = request.args.get("code")
    token = get_token(code)
    client = get_client(token)

    if client is not None:
        sha256_hash = sha256()
        sha256_hash.update(client['id'].encode('utf-8'))
        userid = sha256_hash.hexdigest()

        if 'user' not in session:
            user = User()
            user.id = userid
            user.token = token
            user.name = client['display_name']
            user.url = client['external_urls']['spotify']

            if not len(client['images']) > 0:
                user.image = f"https://ui-avatars.com/api/?name={user.name}&length=1&color=1db954&background=3333&bold=true"
            else:
                user.image = client['images'][0]['url']

            session['user'] = user
            session['userid'] = user.id

        response = make_response(redirect('/user'))
        response.set_cookie('userid', userid, max_age=86400, secure=True)  #24 ore
        return response
    else:
        return redirect('/')

@blueprint.route("/user")
@requirelogin
def user():
    return render_template('user.html',user=session['user'])

@blueprint.route("/new",methods=["POST","GET"])
@requirelogin
def new():
    if request.method == 'POST':
        if session['user'].room and session['user'].room.id in shared['rooms']:
            del shared['rooms'][session['user'].room.id] 
        session['user'].room = None

        name = request.form.get('name',"{Name}")
        userlimit = int(request.form.get('userlimit',5))
        editablequeue = request.form.get('editablequeue',False)
        visibility = request.form.get('visibility',"public")

        room = Room(
            name=name,
            userlimit=userlimit,
            creator=session['user'],
            visibility=visibility,
            editablequeue=True if editablequeue else False
            )

        session['user'].room = room
        shared['rooms'][room.id] = room
        if room.visibility == "public":
            socketio.emit('refresh_rooms',namespace='/join')

        return redirect(f'/room/{room.id}')
    else:
        if session['user'].room: return redirect('/user')

        return render_template('new.html',user=session['user'])
    
@blueprint.route("/join",methods=["POST","GET"])
@requirelogin
def join():
    if request.method == 'POST':
        roomid = request.form.get('room')
        session['user'].room = shared['rooms'][roomid]
        return redirect(f"/room/{roomid}")
    else:
        if session['user'].room: return redirect('/user')
        
        return render_template(
            'join.html',
            user=session['user'],
            rooms=dict(filter(
                lambda item: item[1].visibility == 'public', 
                shared['rooms'].items()))
        )

@blueprint.route("/room/<roomid>")
@requirelogin
def room(roomid : str):
    #if not session['user'].session or session['user'].session.id != roomid:
        #return redirect('/user') 
    # Questo da errore perche' non viene assegnato session['user'].session
    # quando si utilizza il tasto join della card in join, perche' non viene fatta la richiesta post a riga 111
    if roomid not in shared['rooms']:
        return redirect('/user')
    
    if session['user'] not in shared['rooms'][roomid].members:
        shared['rooms'][roomid].members.append(session['user'])
        shared['rooms'][roomid].num_members += 1
        socketio.emit('refresh_rooms',namespace='/join')
        socketio.emit('refresh_room',namespace='/room')

    return render_template('room.html',user=session['user'], room=shared['rooms'][roomid])

@blueprint.route("/room/<roomid>/leave")
@requirelogin
def leave(roomid : str):
    #if roomid not in shared['rooms'] or roomid != session['user'].session.id:
        #return redirect('/')
    if roomid not in shared['rooms']:
        return redirect('/user')

    if shared['rooms'][roomid].creator == session['user']:
        session['user'].room = None
        del shared['rooms'][roomid]
        socketio.emit('refresh_rooms',namespace='/join')
        socketio.emit('refresh_room',namespace='/room')
    else:
        shared['rooms'][roomid].members.remove(session['user'])
        shared['rooms'][roomid].num_members -= 1
        socketio.emit('refresh_rooms',namespace='/join')
        socketio.emit('refresh_room',namespace='/room')

    return redirect('/')

@blueprint.route('/logout')
def logout():
    response = make_response(redirect('/'))
    if session['userid']: response.set_cookie('userid', '', expires=0)
    session.clear()

    return response