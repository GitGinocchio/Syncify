from gevent import monkey
monkey.patch_all()

from flask_session import Session
from flask_cors import CORS
from flask import Flask
from datetime import timedelta
from dotenv import load_dotenv
import tempfile
import os

from SyncifyWeb.utils.config import config
from SyncifyWeb.utils.terminal import getlogger

logger = getlogger()

logger.info("Loading environment variables")
load_dotenv('SyncifyWeb/config/.env')

from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer

from .routes import blueprint
from .sock import socketio
from .oauth import jwt

app = Flask(__name__)
logger.info("Setting up Cross Origin Resource Sharing")
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

logger.info("Setting up Flask Session")
Session(app)

logger.info("Setting up Flask Blueprint")
app.register_blueprint(blueprint)
logger.info("Setting up Flask SocketIO")
socketio.init_app(app)
logger.info("Setting up Flask JWT")
jwt.init_app(app)