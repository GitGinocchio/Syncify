from flask import make_response, redirect, render_template, request, session, url_for, flash
from flask_session import Session as FlaskSession
from datetime import timedelta
from flask import Flask
from hashlib import sha256
from functools import wraps
import tempfile
import spotipy
import os

scopes = [
    'user-modify-playback-state', 'user-read-currently-playing',
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
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_FILE_DIR'] = tempfile.mkdtemp()

FlaskSession(app)
"""
 - Prima idea:

Salvo tutte le stanze in shared e come chiave metto lo userid della persona

userid : Room

I dati dell'utente pero' non posso salvarli tutti all'interno della sessione
salvero' solamente cose strettamente legate all'utente che non devono essere utilizzate altrove
come il token e il refresh token

"""

# Informazioni centralizzate condivise tra tutti i dispositivi e le sessioni
shared = {}

# Informazioni relative al singolo utente e non condivise con altre sessioni
session


def requirelogin(f):

    @wraps(f)
    def wrapper(*args, **kwargs):
        if not (userid := request.cookies.get('userid')) or userid not in shared['users']:
            return redirect('/')
        return f(*args, **kwargs)

    return wrapper


def haslogin():
    pass


@app.route('/')
def root():
    userid = has_login()
    if userid and userid in session:
        return redirect('/user')
    else:
        return render_template('login.html')
