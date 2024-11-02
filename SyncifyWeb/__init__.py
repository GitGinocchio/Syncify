from gevent import monkey
monkey.patch_all()

from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer

from flask_jwt_extended import JWTManager, decode_token
from flask_socketio import SocketIO, join_room, leave_room, close_room, send, emit
from flask_session import Session
from flask_cors import CORS
from flask import Flask

from datetime import timedelta
from dotenv import load_dotenv
import importlib
import tempfile
import os

from SyncifyWeb.utils.config import config
from SyncifyWeb.utils.terminal import getlogger
from SyncifyWeb.utils.classes import User, Room, Challenge

logger = getlogger()

logger.info("Loading environment variables")
load_dotenv('SyncifyWeb/config/.env')

users : dict[str, User] = {}
rooms : dict[str, Room] = {}
challenges : dict[str, Challenge] = {}

logger.info("Setting up Flask Session")
session = Session()

logger.info("Setting up Cross Origin Resource Sharing")
cors = CORS(resources={r"/*": {"origins": "*"}})

logger.info("Setting up Flask SocketIO")
socketio = SocketIO(cors_allowed_origins="*", logger=logger, engineio_logger=(logger if config["debug-mode"] else False),async_mode='gevent')

logger.info("Setting up Flask JWT")
jwt = JWTManager()

app = Flask(__name__)

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

logger.info(f"Loading Flask and SocketIO routes")
routes_path = os.path.dirname(__file__) + '/routes'
for module_name in os.listdir(routes_path):
    module_path = os.path.join(routes_path, module_name)

    if os.path.isdir(module_path) and 'route.py' in os.listdir(module_path):
        route = importlib.import_module(f'SyncifyWeb.routes.{module_name}.route')
        blueprint = getattr(route, 'blueprint', None)

        sock = importlib.import_module(f'SyncifyWeb.routes.{module_name}.sock')
        setup = getattr(sock, 'setup', None)
        if setup: setup(socketio)
        
        if not blueprint: continue
        app.register_blueprint(blueprint)

socketio.init_app(app)
session.init_app(app)
cors.init_app(app)
jwt.init_app(app)