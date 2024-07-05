import spotipy
import os


# In futuro ci sara' un file config
scopes = [
    'user-modify-playback-state', 
    'user-read-currently-playing',
    'user-read-playback-state'
]

CLIENT_SECRET = os.environ['SPOTIPY_CLIENT_SECRET']
CLIENT_ID = os.environ["SPOTIPY_CLIENT_ID"]
REDIRECT_URI = os.environ["SPOTIPY_REDIRECT_URI"]

Oauth = spotipy.SpotifyOAuth(scope=scopes)

def get_client(token : str):
    return spotipy.Spotify(auth=token)