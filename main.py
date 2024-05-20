from flask import make_response, redirect, render_template, request, session
from flask import Flask
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
app.secret_key = (CLIENT_SECRET + CLIENT_ID).encode('ascii').hex()


#Root per la pagina index del sito
@app.route('/')
def root():
    if (tempid := request.cookies.get('tempid')) and tempid in session:
        return redirect('/user')
    else:
        return render_template('login.html')

#Root per la sezione dell'utente dopo che ha eseguito l'accesso
@app.route("/user")
def user():
    if not (tempid := request.cookies.get('tempid')) or tempid not in session:
        return redirect('/')

    if Oauth.is_token_expired(session[tempid]):
        session[tempid] = Oauth.refresh_access_token(session[tempid]["refresh_token"])
    
    client = spotipy.Spotify(auth=session[tempid]['access_token'])
    data = client.current_user()

    return render_template("user.html",
                           userimage=data['images'][0]['url'],
                           username=data['display_name'],
                           userurl=data['external_urls']['spotify'])

#Root per la creazione di una sessione di ascolto dopo che l'utente ha eseguito l'accesso
@app.route("/new")
def new():
    if not (tempid := request.cookies.get('tempid')) or tempid not in session:
        return redirect('/')

    client = spotipy.Spotify(auth=session[tempid]['access_token'])
    data = client.current_user()

    return render_template('new.html',
                           userimage=data['images'][0]['url'],
                           username=data['display_name'],
                           userurl=data['external_urls']['spotify'])

@app.route("/join")
def join():
    if not (tempid := request.cookies.get('tempid')) or tempid not in session:
        return redirect('/')
    
    if Oauth.is_token_expired(session[tempid]):
        session[tempid] = Oauth.refresh_access_token(session[tempid]["refresh_token"])
    
    client = spotipy.Spotify(auth=session[tempid]['access_token'])
    data = client.current_user()

    return render_template("join.html",
                           userimage=data['images'][0]['url'],
                           username=data['display_name'],
                           userurl=data['external_urls']['spotify'])


#@app.route("/session")
#def session(): pass

#Root che reinderizza alla pagina di spotify per l'autentificazione
@app.route('/login')
def login(): 
    return redirect(Oauth.get_authorize_url())

#(Utilizzo solo in development) Root che gestisce il logout dell'account attualmente registrato
@app.route('/logout')
def logout():
    response = make_response(redirect('/'))
    if (tempid := request.cookies.get('tempid')):
        response.set_cookie('tempid', '', expires=0)

    if tempid in session: del session[tempid]
    return response

#Root a cui viene reinderizzato l'utente se ha completato con successo l'autentificazione con spotify
@app.route('/api/spotify/v1/endpoint')
def callback():
    code = request.args.get("code")
    token_info = Oauth.get_access_token(code)

    id = uuid.uuid4()
    session[str(id)] = token_info
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
