from flask_session import Session
from flask_cors import CORS
from flask import Flask
from datetime import timedelta
from dotenv import load_dotenv
import tempfile
import os

from Syncify.utils.config import config
from Syncify.utils.terminal import getlogger

logger = getlogger()

logger.info("Loading environment variables")
load_dotenv('Syncify/config/.env')

from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer
from gevent import monkey
monkey.patch_all()

from .routes import blueprint
from .sock import socketio
from .oauth import jwt

app = Flask(__name__)
logger.info("Setting up Cross Origin Resource Sharing for the application")
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

logger.info(f"Initializing WSGI server on: {config['address']}:{config['port']}")
if config['debug-mode']:
    server = socketio.run(app, host=config['address'],port=config['port'], debug=True, use_reloader=True)
else:
    server = WSGIServer((config['address'], config['port']), app, handler_class=WebSocketHandler, log=logger)

__all__ = ['server']