from flask_jwt_extended import create_access_token, get_jwt_identity
from flask import Blueprint, render_template, make_response, redirect, request, session

blueprint = Blueprint('user',__name__,static_folder='static',template_folder='templates')

from SyncifyWeb import socketio

@blueprint.route('/')
def user():
    socketio.emit("myevent")
    return "Hello world"