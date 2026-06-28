import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load env variables before importing chatbot_logic so it picks up GROQ_API_KEY
load_dotenv()

# Ensure we have the key
if not os.getenv("GROQ_API_KEY"):
    print("WARNING: GROQ_API_KEY not found in environment!")

from chatbot_logic import Chatbot
from chatbot import Chatbot as HFChatbot
from explorer import KnowledgeExplorer
import json
from flask import Response

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL", "*")}}) # Restrict CORS in production

print("Initializing Chatbot AI (this will download vectorstore_cache if missing)...")
bot = Chatbot()
print("Chatbot initialized successfully!")

print("Initializing HF Chatbot and Explorer for the new UI...")
hf_chatbot = HFChatbot()
hf_explorer = KnowledgeExplorer(hf_chatbot)
print("HF Chatbot initialized successfully!")

@app.route("/api/explain", methods=["POST"])
def explain():
    data = request.json
    topic = data.get("topic", "")
    if not topic:
        return jsonify({"error": "No topic provided"}), 400
    
    import json
    base_context = ""
    try:
        with open("datasets/base_content.json", "r", encoding="utf-8") as f:
            base_data = json.load(f)
            if topic in base_data:
                base_context = base_data[topic]
    except Exception as e:
        print(f"Failed to load base content: {e}")

    if base_context:
        context_text = base_context
    else:
        # 1. Retrieve Context from FAISS Database
        docs = bot._retrieve_docs(topic)
        context_text = "\n".join(d.page_content for d in docs[:6])

    # 2. Ask Groq to generate a structured JSON explanation
    sys_prompt = """You are a spiritual and historical AI teacher. Generate a structured explanation based ONLY on the provided context.
Return ONLY a JSON object with keys: intro, narrative, context, takeaways (array of strings), summary."""
    usr_prompt = f"Topic: {topic}\n\nContext:\n{context_text}\n\nEnsure the tone is educational, inspiring, and respectful."

    try:
        response = bot.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": usr_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        ai_text = response.choices[0].message.content.strip()
        return ai_text # Returns raw JSON string which is fine
    except Exception as e:
        print(f"Error in /api/explain: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/quiz", methods=["POST"])
def quiz():
    data = request.json
    explanation = data.get("explanation", "")
    topic = data.get("topic", "")
    
    sys_prompt = f"""You are a quiz master. Based ONLY on the following explanation for the topic '{topic}', generate 3 questions. 
Return ONLY a JSON object with a 'questions' array. Each question object must have: 'type' ("mcq", "tf", or "fill"), 'question' (string), 'options' (array of strings, for mcq/tf only), and 'answer' (integer index for mcq/tf, or string for fill).
Format requirements: 1 mcq, 1 tf, 1 fill."""
    usr_prompt = f"Explanation: {explanation}"

    try:
        response = bot.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": usr_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        ai_text = response.choices[0].message.content.strip()
        return ai_text
    except Exception as e:
        print(f"Error in /api/quiz: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/qa", methods=["POST"])
def qa():
    data = request.json
    topic = data.get("topic", "")
    question = data.get("question", "")

    import json
    base_context = ""
    try:
        with open("datasets/base_content.json", "r", encoding="utf-8") as f:
            base_data = json.load(f)
            if topic in base_data:
                base_context = base_data[topic]
    except Exception as e:
        pass

    # Retrieve context for this specific question
    docs = bot._retrieve_docs(f"{topic} {question}")
    context_text = "\n".join(d.page_content for d in docs[:6])

    if base_context:
        context_text = base_context + "\n\nSupplementary context:\n" + context_text

    sys_prompt = f"""You are an AI teacher helper. You are answering student questions about the topic: '{topic}'.
GUARDRAIL RULE: Check if the student's question is related to '{topic}' or the spiritual/historical events surrounding it.
- If it is related, answer the question accurately in 2-3 sentences based strictly on the context.
- If it is completely off-topic (e.g., asking about cricket, general tech, coding, unrelated subjects), reply EXACTLY with: "You are currently learning {topic}. Please ask questions related to this topic."

Context:
{context_text}
"""
    
    try:
        response = bot.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.3
        )
        ai_text = response.choices[0].message.content.strip()
        return jsonify({"response": ai_text})
    except Exception as e:
        print(f"Error in /api/qa: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/teacher", methods=["POST"])
def teacher():
    data = request.json
    topic = data.get("topic", "")
    history = data.get("history", "") # Includes the user's reflection

    # No heavy FAISS needed here, this is pure reflection
    sys_prompt = f"""You are a spiritual mentor and teacher. The student is reflecting on '{topic}'. 
1. Build on the student's thoughts with a brief encouraging statement.
2. Follow up with another thoughtful, open-ended question to keep the dialogue flowing.
3. Never grade or say answers are 'right' or 'wrong'.
Keep your response short (2-3 sentences max)."""

    try:
        response = bot.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": history}
            ],
            temperature=0.4
        )
        ai_text = response.choices[0].message.content.strip()
        return jsonify({"response": ai_text})
    except Exception as e:
        print(f"Error in /api/teacher: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/media", methods=["POST"])
def media():
    topic = request.json.get("topic", "")
    audios = []
    videos = []
    if os.path.exists("datasets/audio"):
        for f in os.listdir("datasets/audio"):
            if topic.lower().split()[0] in f.lower():
                audios.append({"title": f, "duration": "Unknown", "description": "Local Audio", "url": f"datasets/audio/{f}"})
    if os.path.exists("datasets/video"):
        for f in os.listdir("datasets/video"):
            if topic.lower().split()[0] in f.lower():
                videos.append({"title": f, "description": "Local Video", "thumbnail": "", "videoUrl": f"datasets/video/{f}"})
    return jsonify({"audios": audios, "videos": videos})

import hashlib
import json

USERS_FILE = "datasets/users.json"

def _load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def _save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)

def _hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")
    
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
        
    users = _load_users()
    if username in users:
        return jsonify({"error": "Username already exists"}), 400
        
    users[username] = _hash_password(password)
    _save_users(users)
    return jsonify({"success": True, "message": "User registered successfully"})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")
    
    users = _load_users()
    if username not in users or users[username] != _hash_password(password):
        return jsonify({"error": "Invalid username or password"}), 401
        
    return jsonify({"success": True, "username": username})

@app.route("/api/chat_stream", methods=["POST"])
def chat_stream_endpoint():
    data = request.json
    message = data.get("message", "")
    req_history = data.get("history", [])

    history = []
    user_query = None
    for msg in req_history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            if user_query is not None:
                history.append((user_query, ""))
            user_query = content
        elif role in ("bot", "assistant"):
            if user_query is not None:
                history.append((user_query, content))
                user_query = None
            else:
                history.append(("", content))
    if user_query is not None:
        history.append((user_query, ""))

    def event_generator():
        for event in hf_chatbot.stream_query(message, session_history=history):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return Response(event_generator(), mimetype="text/event-stream")

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    data = request.json
    message = data.get("message", "")
    req_history = data.get("history", [])

    history = []
    user_query = None
    for msg in req_history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            if user_query is not None:
                history.append((user_query, ""))
            user_query = content
        elif role in ("bot", "assistant"):
            if user_query is not None:
                history.append((user_query, content))
                user_query = None
            else:
                history.append(("", content))
    if user_query is not None:
        history.append((user_query, ""))

    try:
        answer, sources = hf_chatbot.process_query(message, session_history=history)
        return jsonify({"reply": answer})
    except Exception as e:
        print(f"Error in /api/chat: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/explore_stream", methods=["POST"])
def explore_stream_endpoint():
    data = request.json
    topic = data.get("topic", "")
    path = data.get("path", [])

    def event_generator():
        for event in hf_explorer.stream_explore(topic, path):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return Response(event_generator(), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
