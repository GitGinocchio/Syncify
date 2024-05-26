from dataclasses import dataclass, field, fields
from typing import List, Type, TypeVar, Any
from datetime import datetime, timedelta
import uuid

DataClass = TypeVar("DataClass")

def from_dict(cls: Type[DataClass], data: dict) -> DataClass:
	kwargs = {}
	for f in fields(cls):
		for d in data:
			if f.name in d:
				kwargs[f.name] = data[f.name]
	return cls(**kwargs)

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
	scope: List[str]

@dataclass
class Session:
	name: str = ""
	userlimit: int = 5
	creator: 'User' = None
	visibility: str = "public"
	id: str = field(default_factory=lambda: uuid.uuid4().hex)
	editablequeue: bool = False
	queue: List[Song] = field(default_factory=list)
	members: List['User'] = field(default_factory=list)
	createdate: str = field(default_factory=lambda: (datetime.now() + timedelta(hours=2)).strftime("%d/%m/%Y %H:%M:%S"))

@dataclass
class User:
	name: str = ""
	url: str = ""
	image: str = ""
	token: Token = None
	session: Session = None
	id: str = None