from flask_jwt_extended import JWTManager, decode_token
from flask import request, session, redirect
from functools import wraps

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