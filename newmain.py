from flask import make_response, redirect, render_template, request, session, url_for, flash
from flask_session import Session as FlaskSession
from datetime import timedelta
from functools import wraps
from flask import Flask
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

Oauth = spotipy.SpotifyOAuth(scope=scopes, cache_path=None)
app = Flask(__name__)

app.config['SESSION_COOKIE_NAME'] = 'Syncify'
app.secret_key = os.urandom(32)

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = True
#app.config['SESSION_FILE_DIR'] = tempfile.mkdtemp()

FlaskSession(app)

# Informazioni centralizzate condivise tra tutti i dispositivi e le sessioni
shared = {'users' : {}, 'rooms' : {}}

# Informazioni relative al singolo utente e non condivise con altre sessioni
session

# - Utils Methods - 

def haslogin():
    if not (userid := verifytoken(request.cookies.get('userid'))) or userid != session.get('userid'):
        return None
    else:
        return userid

def requirelogin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not (userid:=haslogin()): return redirect('/')
        return f(userid=userid, *args, **kwargs)
    return wrapper

# - Routes -

@app.route('/')
def root():
    if haslogin():
        return redirect('/user')
    else:
        return render_template('login.html')

@app.route("/user")
@requirelogin
def user(userid : str):
    return render_template('user.html',user=shared['users'][userid])

@app.route("/new",methods=["POST","GET"])
@requirelogin
def new(userid : str):
    if request.method == 'POST':
        if session[userid].session:
            if session[userid].session.id in shared['rooms']:
                del shared['rooms'][session[userid].session.id]
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
            shared['rooms'][musicsession.id] = musicsession

        return redirect(f'/session/{musicsession.id}')
    else:
        return render_template('new.html',user=session[userid])

@app.route("/join",methods=["POST","GET"])
@requirelogin
def join(userid : str):
    if request.method == 'POST':
        return redirect(f"/session/{request.form.get('session')}")
    else:
        return render_template('join.html',user=session[userid],sessions=shared['rooms'])

@app.route('/login')
def login(): 
    return redirect(Oauth.get_authorize_url())

@app.route('/api/spotify/v1/endpoint')
def callback():
    code = request.args.get("code")
    response = Oauth.get_access_token(code,check_cache=False)
    client = spotipy.Spotify(auth=(token:=Token(**response)).access_token)
    userdata = client.current_user()

    if not userdata['id'] in shared['users']:
        user = User()
        user.id = userdata['id']
        user.name = userdata['display_name']
        user.url = userdata['external_urls']['spotify']
        user.token = userdata['external_urls']['spotify']

        if not len(userdata['images']) > 0:
            user.image = f'https://ui-avatars.com/api/?name={user.name}&length=1&color=1db954&background=3333&bold=true'
        else:
            user.image = userdata['images'][0]['url']
        
        shared['users'][user.id] = user
        session['userid'] = user.id

    token = createtoken(userdata['id'],exp=timedelta(hours=24))
    response = make_response(redirect('/user'))
    response.set_cookie('userid',token,max_age=86400,secure=True,httponly=True)
    return response

# entry point
if __name__ == '__main__':
    app.run(debug=True)
