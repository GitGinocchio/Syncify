from dataclasses import dataclass, field, fields
from datetime import datetime, timedelta, timezone
from jwcrypto import jwt, jwk
import json
import uuid
import os

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
class Session:
	name: str = ""
	userlimit: int = 5
	creator: 'User' = None
	visibility: str = "public"
	id: str = field(default_factory=lambda: uuid.uuid4().hex)
	editablequeue: bool = False
	queue: list[Song] = field(default_factory=list)
	members: list['User'] = field(default_factory=list)
	createdate: str = field(default_factory=lambda: (datetime.now() + timedelta(hours=2)).strftime("%d/%m/%Y %H:%M:%S"))

@dataclass
class User:
	name: str = ""
	url: str = ""
	image: str = ""
	token: Token = None
	session: Session = None
	id: str = None

