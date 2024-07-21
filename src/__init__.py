from flask_session import Session
from flask_cors import CORS
from flask import Flask
from datetime import timedelta
import tempfile
import os

from .routes import blueprint
from .sock import socketio
from .oauth import jwt

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SESSION_COOKIE_NAME'] = 'Syncify Cookies'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True

app.config['JWT_SECRET_KEY'] = os.urandom(32)
app.secret_key = os.urandom(32)

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_FILE_DIR'] = tempfile.mkdtemp() #'./src/.session'

Session(app)

app.register_blueprint(blueprint)
socketio.init_app(app)
jwt.init_app(app)

__all__ = ['app']