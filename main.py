from flask import make_response, redirect, render_template, request, session, url_for, flash
from flask_session import Session as FlaskSession
from datetime import timedelta
from flask import Flask
from hashlib import sha256
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

app.config['SESSION_COOKIE_NAME'] = 'Syncify Cookies'
app.secret_key = os.urandom(32)

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_FILE_DIR'] = tempfile.mkdtemp()

FlaskSession(app)

# Contiene le sessioni condivise con gli altri utenti
shared_sessions = {}

def has_login():
    userid = request.cookies.get('userid')
    if userid and str(userid) in session:
        return userid
    else:
        return None

def is_token_expired(userid : int):
    return Oauth.is_token_expired(session[userid].token.access_token)

#Root per la pagina index del sito
@app.route('/')
def root():
    userid = has_login()
    if userid and userid in session:
        return redirect('/user')
    else:
        return render_template('login.html')

#Root per la sezione dell'utente dopo che ha eseguito l'accesso
@app.route("/user")
def user():
    userid = has_login()
    if not userid: return redirect('/')

    print(session[userid])

    return render_template('user.html',user=session[userid])

#Root per la creazione di una sessione di ascolto dopo che l'utente ha eseguito l'accesso
@app.route("/new",methods=["POST","GET"])
def new():
    userid = has_login()
    if not userid: return redirect('/')

    if request.method == 'POST':
        if session[userid].session:
            if session[userid].session.id in shared_sessions:
                del shared_sessions[session[userid].session.id]
            session[userid].session = None
            
        roomname = request.form.get('name',"{Name}")
        userlimit = int(request.form.get('userlimit',5))
        editablequeue = request.form.get('editablequeue',False)
        visibility = request.form.get('visibility',"public")

        musicsession = Session()
        musicsession.name = roomname
        musicsession.creator = session[userid]
        musicsession.userlimit = userlimit
        musicsession.editablequeue = True if editablequeue else False
        musicsession.visibility = visibility
        
        
        session[userid].session = musicsession
        if musicsession.visibility == "public":
            shared_sessions[musicsession.id] = musicsession

        return redirect(f'/session/{musicsession.id}')
    else:
        return render_template('new.html',user=session[userid])

@app.route("/join",methods=["POST","GET"])
def join():
    userid = has_login()
    if not userid: return redirect('/')
    if request.method == 'POST':
        return redirect(f"/session/{request.form.get('session')}")
    else:
        return render_template('join.html',user=session[userid],sessions=shared_sessions)

@app.route("/session/<sessionid>")
def routesession(sessionid : str):
    userid = has_login()
    if not userid: return redirect('/')
    if not sessionid in shared_sessions:
        if sessionid == session[userid].session.id:
            shared_sessions[sessionid] = session[userid].session
        else: 
            return redirect('/')
    
    return render_template('session.html',user=session[userid], session=shared_sessions[sessionid])

@app.route("/session/<sessionid>/leave")
def leavesession(sessionid : str):
    userid = has_login()
    if not userid: return redirect('/')

    if sessionid == session[userid].session.id:
        del shared_sessions[sessionid]
        session[userid].session = None
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
    userid = has_login()
    if userid: response.set_cookie('userid', '', expires=0)

    if userid in session: del session[userid]
    return response

#Root a cui viene reinderizzato l'utente se ha completato con successo l'autentificazione con spotify
@app.route('/api/spotify/v1/endpoint')
def callback():
    code = request.args.get("code")
    response = Oauth.get_access_token(code,check_cache=False)
    client = spotipy.Spotify(auth=(token:=Token(**response)).access_token)
    data = client.current_user()

    sha256_hash = sha256()
    sha256_hash.update(data['id'].encode('utf-8'))
    userid = sha256_hash.hexdigest()

    if not userid in session:
        user = User()
        user.id = userid
        user.token = token
        user.name = data['display_name']
        user.url = data['external_urls']['spotify']
        
        if not len(data['images']) > 0:
            user.image = f"https://ui-avatars.com/api/?name={user.name}&length=1&color=1db954&background=3333&bold=true"
        else:
            user.image = data['images'][0]['url']
        
        session[user.id] = user

    print(session[userid])
    
    response = make_response(redirect('/user'))
    response.set_cookie('userid', userid, max_age=86400, secure=True)  #24 ore

    return response

# Routes only for development
@app.route('/dev/template')
def template():
    return render_template('template.html')

# entry point
if __name__ == '__main__':
    app.run(debug=True)
