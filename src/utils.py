from dataclasses import dataclass, field, asdict
from typing import Literal
import uuid

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
class Token:
	access_token: str
	refresh_token: str
	token_type: str
	expires_at: int
	expires_in: int
	scope: str

	def asdict(self): return asdict(self)

@dataclass
class Room:
	name: str = None
	userlimit: int = 5
	num_members: int = 0
	creator: 'User' = None
	visibility: str = 'public'
	editablequeue: bool = False
	song_started_at : float = None
	song_paused_at : float = None
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
			'sender' : self.sender.asdict(exclude_devices=True),
			'text' : self.text
		}

@dataclass
class User:
	name: str = field(default_factory=str,init=False)
	url: str = field(default_factory=str,init=False)
	image: str = field(default_factory=str,init=False)
	id: str = field(default_factory=str,init=False)
	devices: list['Device'] = field(default_factory=list,init=False)
	current_device: 'Device' = None
	product: Literal['premium','free'] = None
	client_sid: str = None
	token: Token = None
	room: Room = None

	def __eq__(self, other):
		return self.id == other.id

	def asdict(self,*, exclude_devices : bool = False):
		_dict = {
			'name' : self.name,
			'url' : self.url,
			'image' : self.image,
			'id' : self.id,
			'product' : self.product,
		}
		if not exclude_devices:
			if self.product == 'premium':
				_dict['devices'] = [device.asdict() for device in self.devices]
				_dict['current_device'] = self.current_device.asdict() if self.current_device else None
			else:
				_dict['client_sid'] = self.client_sid
		return _dict

@dataclass
class Device:
	id : str
	name : str
	type : str
	supports_volume : bool
	volume_percent : int
	is_active : bool
	is_private_session : bool
	is_restricted : bool

	def asdict(self): return asdict(self)
