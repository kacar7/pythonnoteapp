# app.py
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import firebase_admin
from firebase_admin import credentials, firestore
import os
import uuid # For generating user IDs for the hardcoded login
from flask_cors import CORS
import json


app = Flask(__name__)
app.secret_key = os.urandom(24) # Secret key for session management
CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5000"])


# --- Firebase Admin SDK Initialization ---
# IMPORTANT: Replace 'path/to/your/serviceAccountKey.json' with the actual path
# to your Firebase service account key JSON file.
# You can generate this file from your Firebase project settings:
# Project settings -> Service accounts -> Generate new private key
try:
    # Check if Firebase app is already initialized to prevent re-initialization errors
    if not firebase_admin._apps:
        firebase_key_str = os.environ.get("FIREBASE_KEY_JSON")
        firebase_key = json.loads(firebase_key_str)
        cred = credentials.Certificate(firebase_key)
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
    # Exit or handle the error appropriately in a production environment
    db = None # Ensure db is None if initialization fails

# --- Hardcoded User ID for "test" login ---
# In a real application, you would manage user sessions and IDs securely.
HARDCODED_USER_ID = "hardcoded-test-user-id"
APP_ID = "topic-tracker-app" # Corresponds to __app_id in the original React app

# --- Routes ---

@app.route('/')
def login_page():
    """Serves the login page."""
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    """Handles login authentication."""
    email = request.form.get('email')
    password = request.form.get('password')

    if email == 'test@test.com' and password == '123321':
        session['logged_in'] = True
        session['user_id'] = HARDCODED_USER_ID
        return redirect(url_for('main_app'))
    else:
        return render_template('login.html', error='Invalid email or password. Please use test/123321.')

@app.route('/app')
def main_app():
    """Serves the main application page after successful login."""
    if not session.get('logged_in'):
        return redirect(url_for('login_page'))
    print (session['user_id'])  #hardcoded user id
    return render_template('index.html', user_id=session['user_id'])

@app.route('/logout')
def logout():
    """Handles user logout."""
    session.pop('logged_in', None)
    session.pop('user_id', None)
    return redirect(url_for('login_page'))

# --- API Endpoints for Firestore Operations ---

@app.route('/api/topics', methods=['GET', 'POST'])
def handle_topics():
    if not session.get('logged_in') or not db:
        return jsonify({"error": "Unauthorized or database not initialized"}), 401

    user_id = session['user_id']
    topics_ref = db.collection(f'artifacts/{APP_ID}/users/{user_id}/topics')

    if request.method == 'GET':
        try:
            docs = topics_ref.stream()
            topics = []
            for doc in docs:
                topic_data = doc.to_dict()
                topic_data['id'] = doc.id
                # Convert Firestore Timestamp to string for JSON serialization
                if 'createdAt' in topic_data and hasattr(topic_data['createdAt'], 'isoformat'):
                    topic_data['createdAt'] = topic_data['createdAt'].isoformat()
                if 'updatedAt' in topic_data and hasattr(topic_data['updatedAt'], 'isoformat'):
                    topic_data['updatedAt'] = topic_data['updatedAt'].isoformat()
                topics.append(topic_data)
            return jsonify(topics)
        except Exception as e:
            return jsonify({"error": f"Error fetching topics: {e}"}), 500

    elif request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        category = data.get('category', 'beginner')
        if not name:
            return jsonify({"error": "Topic name is required"}), 400
        try:
            new_topic = {
                "name": name,
                "category": category,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP
            }
            doc_ref = topics_ref.add(new_topic)
            new_topic['id'] = doc_ref[1].id # doc_ref is a tuple (update_time, document_reference)
            return jsonify(new_topic), 201
        except Exception as e:
            return jsonify({"error": f"Error adding topic: {e}"}), 500

@app.route('/api/topics/<topic_id>', methods=['PUT', 'DELETE'])
def handle_single_topic(topic_id):
    if not session.get('logged_in') or not db:
        return jsonify({"error": "Unauthorized or database not initialized"}), 401

    user_id = session['user_id']
    topic_ref = db.collection(f'artifacts/{APP_ID}/users/{user_id}/topics').document(topic_id)

    if request.method == 'PUT':
        data = request.get_json()
        try:
            update_data = {"updatedAt": firestore.SERVER_TIMESTAMP}
            if 'name' in data:
                update_data['name'] = data['name']
            if 'category' in data:
                update_data['category'] = data['category']

            topic_ref.update(update_data)
            return jsonify({"message": "Topic updated successfully"}), 200
        except Exception as e:
            return jsonify({"error": f"Error updating topic: {e}"}), 500

    elif request.method == 'DELETE':
        try:
            topic_ref.delete()
            return jsonify({"message": "Topic deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": f"Error deleting topic: {e}"}), 500

@app.route('/api/notes', methods=['GET', 'POST'])
def handle_notes():
    if not session.get('logged_in') or not db:
        return jsonify({"error": "Unauthorized or database not initialized"}), 401

    user_id = session['user_id']
    notes_ref = db.collection(f'artifacts/{APP_ID}/users/{user_id}/notes')

    if request.method == 'GET':
        try:
            docs = notes_ref.stream()
            notes = []
            for doc in docs:
                note_data = doc.to_dict()
                note_data['id'] = doc.id
                if 'createdAt' in note_data and hasattr(note_data['createdAt'], 'isoformat'):
                    note_data['createdAt'] = note_data['createdAt'].isoformat()
                if 'updatedAt' in note_data and hasattr(note_data['updatedAt'], 'isoformat'):
                    note_data['updatedAt'] = note_data['updatedAt'].isoformat()
                notes.append(note_data)
            return jsonify(notes)
        except Exception as e:
            return jsonify({"error": f"Error fetching notes: {e}"}), 500

    elif request.method == 'POST':
        data = request.get_json()
        content = data.get('content')
        if not content:
            return jsonify({"error": "Note content is required"}), 400
        try:
            new_note = {
                "content": content,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP
            }
            doc_ref = notes_ref.add(new_note)
            new_note['id'] = doc_ref[1].id
            return jsonify(new_note), 201
        except Exception as e:
            return jsonify({"error": f"Error adding note: {e}"}), 500

@app.route('/api/notes/<note_id>', methods=['PUT', 'DELETE'])
def handle_single_note(note_id):
    if not session.get('logged_in') or not db:
        return jsonify({"error": "Unauthorized or database not initialized"}), 401

    user_id = session['user_id']
    note_ref = db.collection(f'artifacts/{APP_ID}/users/{user_id}/notes').document(note_id)

    if request.method == 'PUT':
        data = request.get_json()
        try:
            update_data = {"updatedAt": firestore.SERVER_TIMESTAMP}
            if 'content' in data:
                update_data['content'] = data['content']
            note_ref.update(update_data)
            return jsonify({"message": "Note updated successfully"}), 200
        except Exception as e:
            return jsonify({"error": f"Error updating note: {e}"}), 500

    elif request.method == 'DELETE':
        try:
            note_ref.delete()
            return jsonify({"message": "Note deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": f"Error deleting note: {e}"}), 500

@app.route('/api/todos', methods=['GET', 'POST'])
def handle_todos():
    if not session.get('logged_in') or not db:
        return jsonify({"error": "Unauthorized or database not initialized"}), 401

    user_id = session['user_id']
    todos_ref = db.collection(f'artifacts/{APP_ID}/users/{user_id}/todos')

    if request.method == 'GET':
        try:
            docs = todos_ref.stream()
            todos = []
            for doc in docs:
                todo_data = doc.to_dict()
                todo_data['id'] = doc.id
                if 'createdAt' in todo_data and hasattr(todo_data['createdAt'], 'isoformat'):
                    todo_data['createdAt'] = todo_data['createdAt'].isoformat()
                if 'updatedAt' in todo_data and hasattr(todo_data['updatedAt'], 'isoformat'):
                    todo_data['updatedAt'] = todo_data['updatedAt'].isoformat()
                todos.append(todo_data)
            return jsonify(todos)
        except Exception as e:
            return jsonify({"error": f"Error fetching todos: {e}"}), 500

    elif request.method == 'POST':
        data = request.get_json()
        text = data.get('text')
        if not text:
            return jsonify({"error": "Todo text is required"}), 400
        try:
            new_todo = {
                "text": text,
                "completed": data.get('completed', False),
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP
            }
            doc_ref = todos_ref.add(new_todo)
            new_todo['id'] = doc_ref[1].id
            return jsonify(new_todo), 201
        except Exception as e:
            return jsonify({"error": f"Error adding todo: {e}"}), 500

@app.route('/api/todos/<todo_id>', methods=['PUT', 'DELETE'])
def handle_single_todo(todo_id):
    if not session.get('logged_in') or not db:
        return jsonify({"error": "Unauthorized or database not initialized"}), 401

    user_id = session['user_id']
    todo_ref = db.collection(f'artifacts/{APP_ID}/users/{user_id}/todos').document(todo_id)

    if request.method == 'PUT':
        data = request.get_json()
        try:
            update_data = {"updatedAt": firestore.SERVER_TIMESTAMP}
            if 'text' in data:
                update_data['text'] = data['text']
            if 'completed' in data:
                update_data['completed'] = data['completed']
            todo_ref.update(update_data)
            return jsonify({"message": "Todo updated successfully"}), 200
        except Exception as e:
            return jsonify({"error": f"Error updating todo: {e}"}), 500

    elif request.method == 'DELETE':
        try:
            todo_ref.delete()
            return jsonify({"message": "Todo deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": f"Error deleting todo: {e}"}), 500

if __name__ == '__main__':
    # Ensure 'templates' and 'static' directories exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    app.run(debug=True) # Set debug=False in production
