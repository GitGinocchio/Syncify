from flask_jwt_extended import create_access_token, get_jwt_identity
from flask import Blueprint, render_template, make_response, redirect, request, session
import os

blueprint = Blueprint('room',__name__,static_folder='static',template_folder='templates')

from SyncifyWeb import socketio

@blueprint.route('/room')
def user():
    socketio.emit('del_room')
    return render_template("room.html", user=None, room=None)