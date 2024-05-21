from flask import make_response, redirect, render_template, request, session, url_for, flash
from functools import wraps
from flask import Flask
import requests
import spotipy
import uuid
import os

scopes = [
    'user-modify-playback-state', 
    'user-read-currently-playing',
    'user-read-playback-state'
]

CLIENT_SECRET = os.environ['SPOTIPY_CLIENT_SECRET']
CLIENT_ID = os.environ["SPOTIPY_CLIENT_ID"]
REDIRECT_URI = os.environ["SPOTIPY_REDIRECT_URI"]

Oauth = spotipy.SpotifyOAuth(scope=scopes)



app = Flask(__name__)
app.config['SESSION_COOKIE_NAME'] = 'Syncify Cookies'
app.secret_key = os.urandom(32)

def has_login():
    tempid = request.cookies.get('tempid')
    if tempid and tempid in session:
        return tempid
    else:
        return None

def is_token_expired(tempid : int):
    return Oauth.is_token_expired(session[tempid]['user'])

def require_login(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        tempid = has_login()
        if not tempid: return redirect('/')

        if is_token_expired(tempid):
            session[tempid] = Oauth.refresh_access_token(session[tempid]['user']['refresh_token'])
        client = spotipy.Spotify(auth=session[tempid]['user']['access_token'])
        
        return f(client,tempid, *args, **kwargs)
    return wrapper

#Root per la pagina index del sito
@app.route('/')
def root():
    tempid = has_login()
    if tempid and tempid in session:
        return redirect('/user')
    else:
        return render_template('login.html')

#Root per la sezione dell'utente dopo che ha eseguito l'accesso
@app.route("/user")
@require_login
def user(client : spotipy.Spotify, tempid : int):
    data = client.current_user()

    #flash(f'Benvenuto {data["display_name"]}!')

    if not len(data['images']) > 0:
        image = f"https://ui-avatars.com/api/?name={data['display_name']}&length=1&color=1db954&background=3333&bold=true"
    else:
        image = data['images'][0]['url']
    
    return render_template("user.html",
                           userimage=image,
                           username=data['display_name'],
                           userurl=data['external_urls']['spotify'])

#Root per la creazione di una sessione di ascolto dopo che l'utente ha eseguito l'accesso
@app.route("/new",methods=["POST","GET"])
@require_login
def new(client : spotipy.Spotify, tempid : int):
    if request.method == 'POST':
        roomname = request.form.get('name')
        userlimit = request.form.get('userlimit')
        editablequeue = request.form.get('editablequeue')
        visibility = request.form.get('visibility')

        print(roomname, userlimit, editablequeue, visibility)

        sessionid = uuid.uuid4().hex[:6]
        session[tempid]['session'] = {
                                      "id" : sessionid,
                                      "name":roomname, 
                                      "userlimit":userlimit, 
                                      "editablequeue": True if editablequeue else False, 
                                      "visibility":visibility
                                     }

        return redirect(f'/session/{sessionid}')
    else:
        data = client.current_user()

        if not len(data['images']) > 0:
            image = f"https://ui-avatars.com/api/?name={data['display_name']}&length=1&color=1db954&background=3333&bold=true"
        else:
            image = data['images'][0]['url']

        return render_template('new.html',
                               userimage=image,
                               username=data['display_name'],
                               userurl=data['external_urls']['spotify'])

@app.route("/join")
@require_login
def join(client : spotipy.Spotify, tempid : int):
    data = client.current_user()

    if not len(data['images']) > 0:
        image = f"https://ui-avatars.com/api/?name={data['display_name']}&length=1&color=1db954&background=3333&bold=true"
    else:
        image = data['images'][0]['url']

    return render_template("join.html",
                           userimage=image,
                           username=data['display_name'],
                           userurl=data['external_urls']['spotify'])

@app.route("/session/<sessionid>")
@require_login
def routesession(client : spotipy.Spotify, tempid : int, sessionid : str):
    data = client.current_user()

    if not len(data['images']) > 0:
        image = f"https://ui-avatars.com/api/?name={data['display_name']}&length=1&color=1db954&background=3333&bold=true"
    else:
        image = data['images'][0]['url']

    return render_template('session.html',
                           userimage=image,
                           username=data['display_name'],
                           userurl=data['external_urls']['spotify'])

#Root che reinderizza alla pagina di spotify per l'autentificazione
@app.route('/login')
def login(): 
    return redirect(Oauth.get_authorize_url())

#(Utilizzo solo in development) Root che gestisce il logout dell'account attualmente registrato
@app.route('/logout')
def logout():
    response = make_response(redirect('/'))
    tempid = has_login()
    if tempid:
        response.set_cookie('tempid', '', expires=0)

    if tempid in session: del session[tempid]
    return response

#Root a cui viene reinderizzato l'utente se ha completato con successo l'autentificazione con spotify
@app.route('/api/spotify/v1/endpoint')
def callback():
    code = request.args.get("code")
    token_info = Oauth.get_access_token(code)

    id = uuid.uuid4()
    session[str(id)] = {"user" : token_info, "session" : None}
    response = make_response(redirect('/user'))
    response.set_cookie('tempid', str(id), max_age=86400, secure=True)  #24 ore

    return response

# Routes only for development
@app.route('/dev/template')
def template():
    return render_template('template.html')

# entry point
if __name__ == '__main__':
    app.run(debug=True)
