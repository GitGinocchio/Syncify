from flask import make_response, redirect, render_template, request, session, url_for, flash
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from flask_session import Session as FlaskSession
from datetime import timedelta
from flask import Flask
from hashlib import sha256
from functools import wraps
from utils import *
import tempfile
import spotipy
import os

scopes = [
    'user-modify-playback-state', 
    'user-read-currently-playing',
    'user-read-playback-state'
]

CLIENT_SECRET = os.environ['SPOTIPY_CLIENT_SECRET']
CLIENT_ID = os.environ["SPOTIPY_CLIENT_ID"]
REDIRECT_URI = os.environ["SPOTIPY_REDIRECT_URI"]

Oauth = spotipy.SpotifyOAuth(scope=scopes)
app = Flask(__name__)
socketio = SocketIO(app,cors_allowed_origins="*", engineio_logger=True)

app.config['SESSION_COOKIE_NAME'] = 'Syncify Cookies'
app.secret_key = os.urandom(32)

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_FILE_DIR'] = tempfile.mkdtemp()


FlaskSession(app)

# Contiene le sessioni condivise con gli altri utenti
shared = {'rooms' : {}}

def haslogin():
    userid = request.cookies.get('userid')
    if userid:
        return userid == session.get('userid')
    else:
        return False

def requirelogin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not haslogin(): return redirect('/')
        return f(*args, **kwargs)
    return wrapper

def is_token_expired():
    return Oauth.is_token_expired(session['user'].token.access_token)

#Root per la pagina index del sito
@app.route('/')
def root():
    if haslogin():
        return redirect('/user')
    else:
        return render_template('login.html')

#Root per la sezione dell'utente dopo che ha eseguito l'accesso
@app.route("/user")
@requirelogin
def user():
    return render_template('user.html',user=session['user'])

#Root per la creazione di una sessione di ascolto dopo che l'utente ha eseguito l'accesso
@app.route("/new",methods=["POST","GET"])
@requirelogin
def new():
    if request.method == 'POST':
        if session['user'].session and session['user'].session.id in shared['rooms']:
            del shared['rooms'][session['user'].session.id] 
        session['user'].session = None

        roomname = request.form.get('name',"{Name}")
        userlimit = int(request.form.get('userlimit',5))
        editablequeue = request.form.get('editablequeue',False)
        visibility = request.form.get('visibility',"public")

        musicsession = Session()
        musicsession.name = roomname
        musicsession.creator = session['user']
        musicsession.userlimit = userlimit
        musicsession.editablequeue = True if editablequeue else False
        musicsession.visibility = visibility


        session['user'].session = musicsession
        shared['rooms'][musicsession.id] = musicsession
        if musicsession.visibility == "public":
            socketio.emit('refresh_sessions',namespace='/join')

        return redirect(f'/session/{musicsession.id}')
    else:
        if session['user'].session: return redirect('/user')

        return render_template('new.html',user=session['user'])

@app.route("/join",methods=["POST","GET"])
@requirelogin
def join():
    if request.method == 'POST':
        sessionid = request.form.get('session')
        session['user'].session = shared['rooms'][sessionid]
        return redirect(f"/session/{sessionid}")
    else:
        if session['user'].session: return redirect('/user')
        
        return render_template(
            'join.html',
            user=session['user'],
            sessions=dict(filter(
                lambda item: item[1].visibility == 'public', 
                shared['rooms'].items()))
        )

@app.route("/session/<sessionid>")
@requirelogin
def routesession(sessionid : str):
    #if not session['user'].session or session['user'].session.id != sessionid:
        #return redirect('/user') 
    # Questo da errore perche' non viene assegnato session['user'].session
    # quando si utilizza il tasto join della card in join, perche' non viene fatta la richiesta post a riga 111
    if sessionid not in shared['rooms']:
        return redirect('/user')
    
    if session['user'] not in shared['rooms'][sessionid].members:
        shared['rooms'][sessionid].members.append(session['user'])
        shared['rooms'][sessionid].num_members += 1
        socketio.emit('refresh_sessions',namespace='/join')
        socketio.emit('refresh_session',namespace='/session')

    return render_template('session.html',user=session['user'], session=shared['rooms'][sessionid])

@app.route("/session/<sessionid>/leave")
@requirelogin
def leavesession(sessionid : str):
    #if sessionid not in shared['rooms'] or sessionid != session['user'].session.id:
        #return redirect('/')
    if sessionid not in shared['rooms']:
        return redirect('/user')

    if shared['rooms'][sessionid].creator == session['user']:
        session['user'].session = None
        del shared['rooms'][sessionid]
        socketio.emit('refresh_sessions',namespace='/join')
        socketio.emit('refresh_session',namespace='/session')
    else:
        shared['rooms'][sessionid].members.remove(session['user'])
        shared['rooms'][sessionid].num_members -= 1
        socketio.emit('refresh_sessions',namespace='/join')
        socketio.emit('refresh_session',namespace='/session')

    return redirect('/')
#Root che reinderizza alla pagina di spotify per l'autentificazione

@app.route('/login')
def login(): 
    return redirect(Oauth.get_authorize_url())

#Root che reinderizza alla pagina di spotify per l'accesso
#(Utilizzo solo in development) Root che gestisce il logout dell'account attualmente registrato
@app.route('/logout')
def logout():
    response = make_response(redirect('/'))
    if session['userid']: response.set_cookie('userid', '', expires=0)
    session.clear()

    return response

#Root a cui viene reinderizzato l'utente se ha completato con successo l'autentificazione con spotify
@app.route('/api/spotify/v1/endpoint')
def callback():
    code = request.args.get("code")
    response = Oauth.get_access_token(code,check_cache=False)
    client = spotipy.Spotify(auth=(token:=Token(**response)).access_token)
    data = client.current_user()

    if data is not None:
        sha256_hash = sha256()
        sha256_hash.update(data['id'].encode('utf-8'))
        userid = sha256_hash.hexdigest()

        if 'user' not in session:
            user = User()
            user.id = userid
            user.token = token
            user.name = data['display_name']
            user.url = data['external_urls']['spotify']

            if not len(data['images']) > 0:
                user.image = f"https://ui-avatars.com/api/?name={user.name}&length=1&color=1db954&background=3333&bold=true"
            else:
                user.image = data['images'][0]['url']

            session['user'] = user
            session['userid'] = user.id

        response = make_response(redirect('/user'))
        response.set_cookie('userid', userid, max_age=86400, secure=True)  #24 ore
        return response
    else:
        return redirect('/')

# Routes only for development
@app.route('/dev/template')
def template():
    return render_template('template.html')

@socketio.on('connect', namespace='/join')
def connect_to_join():
    emit('connected')

@socketio.on('connect', namespace='/session')
def connect_to_session():
    emit('connected')

@socketio.on('handle_message', namespace='/session')
def handle_message(data):
    sessionid = data['sessionid']
    message = Message(data['username'],data['userimage'],data['userurl'],data['userid'],data['message'])
    shared['rooms'][sessionid].chat.append(message)
    socketio.emit('refresh_session',namespace='/session')
    

# entry point
if __name__ == '__main__':
    socketio.run(app, debug=True)
    #app.run(debug=True)
