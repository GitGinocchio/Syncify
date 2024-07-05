import spotipy
import os

from .utils import Token

CLIENT_SECRET = os.environ['SPOTIPY_CLIENT_SECRET']
CLIENT_ID = os.environ["SPOTIPY_CLIENT_ID"]
REDIRECT_URI = os.environ["SPOTIPY_REDIRECT_URI"]
SCOPE = os.environ['SPOTIPY_SCOPE']

cache_handler = spotipy.CacheFileHandler('src/cache/.cache')

Oauth = spotipy.SpotifyOAuth(scope=SCOPE, cache_handler=cache_handler)

def get_token(code : str):
    response = Oauth.get_access_token(code,check_cache=False)
    return Token(**response)

def refresh_token(token : Token):
    pass

def get_client(token : Token):

    spotify = spotipy.Spotify(auth=token.access_token,oauth_manager=Oauth)

    return spotify.current_user()