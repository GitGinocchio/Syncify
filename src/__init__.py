from flask import Flask
from flask_session import Session
from datetime import timedelta
import tempfile
import os

from .routes import blueprint
from .sock import socketio

app = Flask(__name__)

app.config['SESSION_COOKIE_NAME'] = 'Syncify Cookies'
app.secret_key = os.urandom(32)

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_FILE_DIR'] = tempfile.mkdtemp()

Session(app)

app.register_blueprint(blueprint)
socketio.init_app(app)

del os, tempfile, timedelta, Session, Flask

__all__ = ['app']