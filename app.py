import json
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_socketio import SocketIO
from threading import Thread
from botmodel import run_conversation  # Import conversation logic

# Flask app setup
wapp = Flask(__name__, static_url_path='/static')
socketio = SocketIO(wapp, cors_allowed_origins="*")  # Enable heartbeat
CORS(wapp)

# -------------------- WebSocket Handlers --------------------
@socketio.on('connect', namespace='/dd')
def ws_conn():
    print("Client connected")
    socketio.emit('msg', {'connected': True}, namespace='/dd')

@socketio.on('disconnect', namespace='/dd')
def ws_disconn():
    print("Client disconnected")
    socketio.emit('msg', {'connected': False}, namespace='/dd')

@socketio.on('message', namespace='/dd')
def handle_message(resp):
    try:
        print("Message received via WebSocket:", resp)
        user_input = resp.get('content')
        # Handle long-running operations in a separate thread
        Thread(target=process_conversation, args=(user_input,)).start()
    except Exception as e:
        print("Error in WebSocket message handler:", e)
        socketio.emit('error', {'error': str(e)}, namespace='/dd')

def process_conversation(user_input):
    """
    Process the conversation logic in a separate thread.
    """
    try:
        response = run_conversation(user_input)
        socketio.emit('msg', {'response': response}, namespace='/dd')
    except Exception as e:
        print("Error in process_conversation:", e)
        socketio.emit('error', {'error': str(e)}, namespace='/dd')

@socketio.on_error_default
def default_error_handler(e):
    print("An error occurred:", e)

# -------------------- REST API Endpoints --------------------
@wapp.route("/api/conversation", methods=["POST"])
def conversation_route():
    """
    Handle conversation requests via REST API.
    """
    try:
        data = request.json
        user_input = data.get('content')
        print("Input received:", user_input)
        response = run_conversation(user_input)
        return jsonify({"status": True, "data": response}), 200
    except Exception as e:
        print("Error in conversation route:", e)
        return jsonify({"status": False, "error": str(e)}), 500

@wapp.route("/reminder/<message>/<body_text>/<to>", methods=["POST"])
def notify_comment(message, body_text, to):
    """
    Emit a reminder notification via WebSocket.
    """
    try:
        socketio.emit('reminder', {'header': message, "body": body_text, "user_id": to}, namespace='/dd')
        return jsonify({"status": True}), 200
    except Exception as e:
        print("Error in notification route:", e)
        return jsonify({"status": False, "error": str(e)}), 500

@wapp.route("/", methods=["GET", "POST"])
def index():
    """
    Render the index page.
    """
    return render_template('index.html')

if __name__ == '__main__':
    # Use SocketIO to run the server
    socketio.run(wapp, host="0.0.0.0", port=3003, debug=True, use_reloader=False)
