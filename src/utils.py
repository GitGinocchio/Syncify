from dataclasses import dataclass, field, asdict
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
	creator: 'User' = None
	visibility: str = "public"
	editablequeue: bool = False
	num_members: int = 0
	chat: list['Message'] = field(default_factory=list)
	members: list['User'] = field(default_factory=list)
	id: str = field(default_factory=lambda: uuid.uuid4().hex)
	queue: list[Song] = field(default_factory=list)

	def __eq__(self, other):
		return self.id == other.id

	def asdict(self):
		return {
			'name' : self.name,
			'userlimit' : self.userlimit,
			'creator' : self.creator.asdict(),
			'visbility' : self.visibility,
			'editablequeue' : self.editablequeue,
			'num_members' : self.num_members,
			'id' : self.id
		}
		
@dataclass
class User:
	name: str = field(default_factory=str,init=False)
	url: str = field(default_factory=str,init=False)
	image: str = field(default_factory=str,init=False)
	id: str = field(default_factory=str,init=False)
	refreshing : bool = field(default=False)
	last_connection_time : float = None
	token: Token = None
	room: Room = None

	def __eq__(self, other):
		return self.id == other.id

	def asdict(self):
		return {
			'name' : self.name,
			'url' : self.url,
			'image' : self.image,
			'id' : self.id,
			#'token' : self.token.asdict() # Disattivato per maggior sicurezza
		}

@dataclass
class Message:
	sender_name : str
	sender_image : str
	sender_url : str
	sender_id : str
	text : str = None

	def asdict(self): return asdict(self)