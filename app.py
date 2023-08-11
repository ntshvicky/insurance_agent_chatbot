import json
from flask import Flask,jsonify,render_template, request
from flask_cors import CORS
import requests
#---------- socket module import -----------------
from flask_socketio import SocketIO, join_room, leave_room

from botmodel import run_conversation

wapp = Flask(__name__, static_url_path='/static')
socketio = SocketIO(wapp, cors_allowed_origins="*")
CORS(wapp)


# -------------------------- Socket for Notification --------------------------
@socketio.on('connect', namespace='/dd')
def ws_conn():
    socketio.emit('msg', {'connected': True}, namespace='/dd')

@socketio.on('disconnect', namespace='/dd')
def ws_disconn():
    socketio.emit('msg', {'connected': False}, namespace='/dd')

@socketio.on('message', namespace='/dd')
def handle_message(resp):
    socketio.emit('msg', {'notification': resp}, namespace='/dd')



@socketio.on_error_default  # handles all namespaces without an explicit error handler
def default_error_handler(e):
    print('An error occured:')
    print(e)

#========================================================

#=============================APIs===========================
@wapp.route("/api/conversation", methods=["POST"])
def conversation_route():
    print(request.json)
    content = request.json['content']
    resp = run_conversation(content)
    return jsonify({"status": True, 'data': resp}), 200

@wapp.route("/reminder/<message>/<body_text>/<to>", methods=["POST"])
def notify_comment(message, body_text, to):
    socketio.emit('reminder', {'header': message, "body": body_text, "user_id": to}, namespace='/dd')
    return jsonify({"status": True}), 200

@wapp.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

if __name__=='__main__':
    #wapp.run("0.0.0.0", port=3003, debug=True)
    socketio.run(wapp, "0.0.0.0", port=3003)
