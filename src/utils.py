from dataclasses import dataclass, field
from flask import request, session, redirect
from functools import wraps
from .oauth import Oauth
import uuid

@dataclass
class Song:
	url : str
	name : str
	artist : str
	album : str
	duration : float

@dataclass
class Token:
	access_token: str
	refresh_token: str
	token_type: str
	expires_at: int
	expires_in: int
	scope: str

@dataclass
class Room:
	name: str = None
	userlimit: int = 5
	creator: 'User' = None
	visibility: str = "public"
	editablequeue: bool = False
	num_members: int = 0
	chat: list = field(default_factory=list)
	members: list['User'] = field(default_factory=list)
	id: str = field(default_factory=lambda: uuid.uuid4().hex)
	queue: list[Song] = field(default_factory=list)

	def __eq__(self, other):
		return self.id == other.id

@dataclass
class User:
	name: str = field(default_factory=str,init=False)
	url: str = field(default_factory=str,init=False)
	image: str = field(default_factory=str,init=False)
	token: Token = None
	room: Room = None
	id: str = field(default_factory=str,init=False)

	def __eq__(self, other):
		return self.id == other.id

@dataclass
class Message:
	sender_name : str
	sender_image : str
	sender_url : str
	sender_id : str
	text : str = None

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