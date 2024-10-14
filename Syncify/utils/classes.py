from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from typing import Literal
import uuid

@dataclass
class Challenge:
	id : uuid.UUID = field(default_factory=uuid.uuid4, init=False)
	exp : datetime = field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(seconds=30), init=False)
	status : Literal['pending', 'accepted', 'refused'] = field(default_factory=lambda: 'pending',init=False)

@dataclass
class Song:
	id : str
	url : str
	name : str
	popularity : int
	duration : str
	duration_ms : int
	preview_url : str
	album : dict[str]
	artists : list[dict]
	addedby : 'User' = field(default=None)

	def asdict(self): 
		return {
			'id' : self.id,
			'url' : self.url,
			'name' : self.name,
			'popularity' : self.popularity,
			'duration' : self.duration,
			'duration_ms' : self.duration_ms,
			'preview_url' : self.preview_url,
			'album' : self.album,
			'artists' : self.artists,
			'addedby' : self.addedby.asdict() if self.addedby else None
		}

@dataclass(frozen=True)
class Token:
	access_token: str
	expires_at: int

	def asdict(self): return asdict(self)

@dataclass
class Room:
	name: str = None
	userlimit: int = 5
	num_members: int = 0
	creator: 'User' = None
	editablequeue: bool = False
	song_started_at : float = None
	song_paused_at : float = None
	visibility: Literal['public','private'] = 'public'
	status : Literal['idle','playing'] = 'idle'
	chat: list['Message'] = field(default_factory=list)
	members: list['User'] = field(default_factory=list)
	id: str = field(default_factory=lambda: uuid.uuid4().hex)
	queue: list[Song] = field(default_factory=list)
	history: list[Song] = field(default_factory=list)

	def __eq__(self, other):
		return self.id == other.id

	def asdict(self):
		return {
			'id' : self.id,
			'name' : self.name,
			'status' : self.status,
			'userlimit' : self.userlimit,
			'creator' : self.creator.asdict(),
			'visbility' : self.visibility,
			'editablequeue' : self.editablequeue,
			'num_members' : self.num_members,
			'song_started_at' : self.song_started_at,
			'song_paused_at' : self.song_paused_at
		}

@dataclass
class Message:
	sender : 'User'
	text : str = None

	def asdict(self): 
		return {
			'sender' : self.sender.asdict(),
			'text' : self.text
		}

@dataclass
class Client:
	sid : str = field(init=True)
	challenge : Challenge = field(init=False, default_factory=lambda: Challenge())
	connected_at : datetime = field(default_factory=lambda: datetime.now(timezone.utc), init=False)

	def __eq__(self, other):
		return self.sid == other.sid

@dataclass
class User:
	name: str = field(default_factory=str,init=True)
	url: str = field(default_factory=str,init=True)
	image: str = field(default_factory=str,init=True)
	id: str = field(default_factory=str,init=True)
	clients : dict[str, Client] = field(default_factory=dict, init=False)
	token: Token = None
	room: Room = None

	def __eq__(self, other):
		return self.id == other.id

	def asdict(self):
		return {
			'name' : self.name,
			'url' : self.url,
			'image' : self.image,
			'id' : self.id
		}