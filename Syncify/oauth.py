from flask_jwt_extended import JWTManager, decode_token
from flask import request, session, redirect
from functools import wraps
import spotipy
import os

from Syncify.utils.classes import Token

SCOPE = os.environ['SPOTIPY_SCOPE']

cache_handler = spotipy.CacheFileHandler(os.devnull)

Oauth = spotipy.SpotifyOAuth(scope=SCOPE, cache_handler=cache_handler)

jwt = JWTManager()

# User ID

def hasuserid():
    access_token = request.cookies.get('user_access_token')
    if access_token:
        try:
            userid = decode_token(access_token)['sub']
            return userid == session.get('userid')
        except Exception:
            return False
    else:
        return False

def getuserid():
    access_token = request.cookies.get('user_access_token')
    if access_token:
        try:
            userid = str(decode_token(access_token)['sub'])
            return userid
        except Exception:
            return None
    else:
        return None

def useridrequired(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not hasuserid(): return redirect('/')
        return f(*args, **kwargs)
    return wrapper

# Room ID

def hasroomid():
    access_token = request.cookies.get('room_access_token')
    if access_token:
        try:
            roomid = decode_token(access_token)['sub']
            return roomid == session.get('roomid')
        except Exception:
            return False
    else:
        return False

def getroomid():
    access_token = request.cookies.get('room_access_token')
    if access_token:
        try:
            userid = str(decode_token(access_token)['sub'])
            return userid
        except Exception:
            return None
    else:
        return None

def roomidrequired(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not hasroomid(): return redirect('/')
        return f(*args, **kwargs)
    return wrapper

# Token

def get_token(code : str):
    response = Oauth.get_access_token(code,check_cache=False)
    return Token(**response)

def refresh_token(token : Token):
    newtoken = Token(**Oauth.refresh_access_token(token.refresh_token))
    token.access_token = newtoken.access_token
    token.expires_at = newtoken.expires_at
    
def get_client(token : Token):
    if Oauth.is_token_expired(token.asdict()): refresh_token(token)
    client = spotipy.Spotify(auth=token.access_token,oauth_manager=Oauth)
    
    return client