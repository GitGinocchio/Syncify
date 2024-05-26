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

key = jwk.JWK(k=os.environ['JWT_SECRET_KEY'],kty='oct')

def createtoken(payload : dict | str, exp : timedelta):
	expdate = (datetime.now(timezone.utc) + exp).timestamp()
	if isinstance(payload,dict): payload['exp'] = expdate
	else: payload = {'str': payload, 'exp' : expdate}
	token = jwt.JWT(header={"alg": "HS256"},claims=payload)
	token.make_signed_token(key)
	return token.serialize()

def verifytoken(token : str):
	try:
		payload = jwt.JWT(key=key,jwt=token)
		claims = dict(json.loads(payload.claims))
		exp = claims['exp']
		if exp and datetime.now(timezone.utc).timestamp() > exp:
			raise jwt.JWTExpired("Token has expired")
		claims.pop('exp')

		claim = claims.get('str')
		if claim: return claim
		return claims
	except (jwt.JWTExpired,jwt.JWTInvalidClaimValue):
		return None

