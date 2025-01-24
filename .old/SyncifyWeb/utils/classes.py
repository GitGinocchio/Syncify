from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from enum import StrEnum
from typing import Literal
import uuid

@dataclass
class Challenge:
	userid : str = field(init=True)
	sid : str = field(init=True)
	locale : str = field(init=True, default="en")
	version : str = field(init=True, default="unspecified")
	platform : str = field(init=True,default="unspecified")
	os_name : str = field(init=True, default="unspecified")
	os_version : str = field(init=True, default="unspecified")
	id : uuid.UUID = field(default_factory=uuid.uuid4, init=False)
	exp : datetime = field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(seconds=30), init=False)
	status : 'Status' = field(default_factory=lambda: Challenge.Status.PENDING,init=False)

	class Status(StrEnum):
		PENDING = 'pending'
		ACCEPTED = 'accepted'
		REFUSED = 'refused'

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

@dataclass
class Room:
	name: str = None
	userlimit: int = 5
	num_members: int = 0
	creator: 'User' = None
	editablequeue: bool = False
	song_started_at : float = None
	song_paused_at : float = None
	visibility: 'Visibility' = field(init=True, default=lambda: Room.Visibility.PUBLIC)
	status : 'Status' = field(init=True, default=lambda: Room.Status.IDLE)
	chat: list['Message'] = field(default_factory=list)
	members: list['User'] = field(default_factory=list)
	id: uuid.UUID = field(default_factory=uuid.uuid4)
	queue: list[Song] = field(default_factory=list)
	history: list[Song] = field(default_factory=list)

	class Status(StrEnum):
		IDLE = 'idle'
		PLAYING = 'playing'

	class Visibility(StrEnum):
		PUBLIC = 'public'
		PRIVATE = 'private'

	def __eq__(self, other):
		return self.id == other.id

	def asdict(self):
		return {
			'id' : self.id.hex,
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
	locale : str = field(init=True, default="en")
	version : str = field(init=True, default="unspecified")
	platform : str = field(init=True,default="unspecified")
	os_name : str = field(init=True, default="unspecified")
	os_version : str = field(init=True, default="unspecified")
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