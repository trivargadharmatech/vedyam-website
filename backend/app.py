import os
import json
import re
import time
import functools
import mimetypes
from urllib.parse import urlparse, parse_qs

from flask import Flask, request, jsonify, g, Response, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Check GROQ for simulator RAG
if not os.getenv("GROQ_API_KEY"):
    print("WARNING: GROQ_API_KEY not found in environment!")

from config import HOST, PORT, FRONTEND_DIR, GEMINI_API_KEY, APP_NAME
from db import get_db, init_db
from auth import hash_password, verify_password, create_token, verify_token
import website_chatbot

# Simulator Chatbot imports
from chatbot_logic import Chatbot as SimulatorChatbotLogic
from chatbot import Chatbot as HFChatbot
from explorer import KnowledgeExplorer

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL", "*")}})

print("Initializing Simulator AI components...")
try:
    hf_chatbot = HFChatbot()
    hf_explorer = KnowledgeExplorer(hf_chatbot)
    
    if os.getenv("DATABASE_URL") and os.getenv("HF_TOKEN"):
        sim_chatbot_logic = SimulatorChatbotLogic()
    else:
        print("Local mode: Using HFChatbot for Simulator Logic.")
        sim_chatbot_logic = hf_chatbot
        
    print("Simulator AI initialized successfully!")
except Exception as e:
    print(f"Warning: Failed to initialize Simulator AI: {e}")
    hf_chatbot = None
    hf_explorer = None
    sim_chatbot_logic = None

init_db()

# --- Before/After Request for DB Connection ---
@app.before_request
def before_request():
    g.conn = get_db()

@app.teardown_request
def teardown_request(exception):
    conn = getattr(g, 'conn', None)
    if conn is not None:
        if exception is None:
            conn.commit()
        conn.close()

# --- Auth Helpers ---
def get_auth_user():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:].strip() if auth_header.startswith("Bearer ") else ""
    uid = verify_token(token) if token else None
    if uid:
        return g.conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
    return None

def require_auth(roles=None):
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            user = get_auth_user()
            if not user:
                return jsonify({"error": "Please sign in to continue"}), 401
            if roles and user["role"] not in roles:
                return jsonify({"error": "You do not have access to this action"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# ---------- Serializers ----------
def user_json(r):
    return {"id": r["id"], "name": r["name"], "email": r["email"],
            "role": r["role"], "bio": r["bio"] or "", "created_at": r["created_at"]}

def course_json(r):
    return {
        "id": r["id"], "title": r["title"], "category": r["category"],
        "level": r["level"], "duration": r["duration"], "summary": r["summary"],
        "description": r["description"], "lessons": json.loads(r["lessons"] or "[]"),
        "accent": r["accent"], "status": r["status"], "review_note": r["review_note"] or "",
        "instructor_id": r["instructor_id"],
        "instructor": r["instructor"] if "instructor" in r.keys() else None,
        "created_at": r["created_at"],
    }

# ==========================================
# WEBSITE ROUTES (From server.py)
# ==========================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "app": APP_NAME, "gemini": bool(GEMINI_API_KEY)})

@app.route("/api/stats", methods=["GET"])
def stats():
    n_courses = g.conn.execute("SELECT COUNT(*) n FROM courses WHERE status='approved'").fetchone()["n"]
    n_learn = g.conn.execute("SELECT COUNT(*) n FROM users WHERE role='user'").fetchone()["n"]
    n_inst = g.conn.execute("SELECT COUNT(*) n FROM users WHERE role='instructor'").fetchone()["n"]
    return jsonify({"courses": n_courses, "learners": n_learn, "instructors": n_inst})

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    pw = data.get("password") or ""
    role = data.get("role") or "user"
    
    if role not in ("user", "instructor"):
        role = "user"
    if not name or not email or len(pw) < 6:
        return jsonify({"error": "Name, email and a 6+ character password are required"}), 400
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Please enter a valid email"}), 400
        
    exists = g.conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone()
    if exists:
        return jsonify({"error": "An account with this email already exists"}), 409
        
    cur = g.conn.execute(
        "INSERT INTO users (name,email,password,role,bio,created_at) VALUES (?,?,?,?,?,?)",
        (name, email, hash_password(pw), role, "", int(time.time())),
    )
    row = g.conn.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
    return jsonify({"token": create_token(row["id"]), "user": user_json(row)})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    pw = data.get("password") or ""
    
    row = g.conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not row or not verify_password(pw, row["password"]):
        return jsonify({"error": "Incorrect email or password"}), 401
        
    return jsonify({"token": create_token(row["id"]), "user": user_json(row)})

@app.route("/api/me", methods=["GET"])
@require_auth()
def get_me():
    user = get_auth_user()
    return jsonify({"user": user_json(user)})

@app.route("/api/me", methods=["PATCH"])
@require_auth()
def update_me():
    user = get_auth_user()
    data = request.json or {}
    name = (data.get("name") or user["name"]).strip()
    bio = data.get("bio", user["bio"]) or ""
    
    g.conn.execute("UPDATE users SET name=?, bio=? WHERE id=?", (name, bio, user["id"]))
    row = g.conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    return jsonify({"user": user_json(row)})

@app.route("/api/courses", methods=["GET", "POST"])
def courses():
    if request.method == "GET":
        rows = g.conn.execute(
            """SELECT c.*, u.name AS instructor FROM courses c
               LEFT JOIN users u ON u.id=c.instructor_id
               WHERE c.status='approved' ORDER BY c.created_at DESC"""
        ).fetchall()
        return jsonify({"courses": [course_json(r) for r in rows]})
        
    elif request.method == "POST":
        user = get_auth_user()
        if not user or user["role"] not in ("instructor", "superadmin"):
            return jsonify({"error": "You do not have access to this action"}), 403
            
        b = request.json or {}
        title = (b.get("title") or "").strip()
        if not title:
            return jsonify({"error": "A course title is required"}), 400
            
        lessons = b.get("lessons") or []
        if isinstance(lessons, str):
            lessons = [s.strip() for s in lessons.split("\n") if s.strip()]
            
        cur = g.conn.execute(
            """INSERT INTO courses
               (title,category,level,duration,summary,description,lessons,accent,
                instructor_id,status,review_note,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (title, b.get("category") or "Wisdom", b.get("level") or "Foundation",
             b.get("duration") or "4 weeks", b.get("summary") or "",
             b.get("description") or "", json.dumps(lessons), b.get("accent") or "indigo",
             user["id"], "proposed", "", int(time.time())),
        )
        row = g.conn.execute("SELECT * FROM courses WHERE id=?", (cur.lastrowid,)).fetchone()
        return jsonify({"course": course_json(row)})

@app.route("/api/my-courses", methods=["GET"])
@require_auth(["instructor", "superadmin"])
def my_courses():
    user = get_auth_user()
    rows = g.conn.execute(
        "SELECT c.*, u.name AS instructor FROM courses c LEFT JOIN users u ON u.id=c.instructor_id "
        "WHERE c.instructor_id=? ORDER BY c.created_at DESC", (user["id"],)
    ).fetchall()
    return jsonify({"courses": [course_json(r) for r in rows]})

@app.route("/api/admin/pending", methods=["GET"])
@require_auth(["superadmin"])
def pending_courses():
    rows = g.conn.execute(
        "SELECT c.*, u.name AS instructor FROM courses c LEFT JOIN users u ON u.id=c.instructor_id "
        "WHERE c.status='proposed' ORDER BY c.created_at ASC"
    ).fetchall()
    return jsonify({"courses": [course_json(r) for r in rows]})

@app.route("/api/my-learning", methods=["GET"])
@require_auth()
def my_learning():
    user = get_auth_user()
    rows = g.conn.execute(
        """SELECT e.id AS enrollment_id, e.progress, c.* FROM enrollments e
           JOIN courses c ON c.id=e.course_id
           WHERE e.user_id=? ORDER BY e.created_at DESC""", (user["id"],)
    ).fetchall()
    items = []
    for r in rows:
        d = course_json(r)
        d["enrollment_id"] = r["enrollment_id"]
        d["progress"] = r["progress"]
        items.append(d)
    return jsonify({"learning": items})

@app.route("/api/course/<int:cid>", methods=["GET"])
def get_course(cid):
    row = g.conn.execute(
        """SELECT c.*, u.name AS instructor FROM courses c
           LEFT JOIN users u ON u.id=c.instructor_id WHERE c.id=?""", (cid,)
    ).fetchone()
    if not row:
        return jsonify({"error": "Course not found"}), 404
        
    if row["status"] != "approved":
        user = get_auth_user()
        allowed = user and (user["role"] == "superadmin" or user["id"] == row["instructor_id"])
        if not allowed:
            return jsonify({"error": "Course not found"}), 404
            
    return jsonify({"course": course_json(row)})

@app.route("/api/course/<int:cid>/review", methods=["POST"])
@require_auth(["superadmin"])
def review_course(cid):
    b = request.json or {}
    action = b.get("action")
    if action not in ("approve", "reject"):
        return jsonify({"error": "action must be 'approve' or 'reject'"}), 400
        
    row = g.conn.execute("SELECT * FROM courses WHERE id=?", (cid,)).fetchone()
    if not row:
        return jsonify({"error": "Course not found"}), 404
        
    status = "approved" if action == "approve" else "rejected"
    g.conn.execute("UPDATE courses SET status=?, review_note=? WHERE id=?",
                 (status, b.get("note") or "", cid))
    return jsonify({"id": cid, "status": status})

@app.route("/api/course/<int:cid>/enroll", methods=["POST"])
@require_auth(["user"])
def enroll_course(cid):
    user = get_auth_user()
    course = g.conn.execute("SELECT * FROM courses WHERE id=? AND status='approved'", (cid,)).fetchone()
    if not course:
        return jsonify({"error": "Course not found"}), 404
        
    try:
        g.conn.execute("INSERT INTO enrollments (user_id,course_id,progress,created_at) VALUES (?,?,?,?)",
                     (user["id"], cid, 0, int(time.time())))
    except Exception:
        pass  # already enrolled
    return jsonify({"enrolled": True, "course_id": cid})

@app.route("/api/enrollment/<int:eid>/progress", methods=["POST"])
@require_auth()
def update_progress(eid):
    user = get_auth_user()
    b = request.json or {}
    try:
        p = max(0, min(100, int(b.get("progress", 0))))
    except (TypeError, ValueError):
        return jsonify({"error": "progress must be a number"}), 400
        
    row = g.conn.execute("SELECT * FROM enrollments WHERE id=? AND user_id=?", (eid, user["id"])).fetchone()
    if not row:
        return jsonify({"error": "Enrollment not found"}), 404
        
    g.conn.execute("UPDATE enrollments SET progress=? WHERE id=?", (p, eid))
    return jsonify({"enrollment_id": eid, "progress": p})

@app.route("/api/website/chat", methods=["POST"])
def website_chat():
    b = request.json or {}
    msg = b.get("message") or ""
    history = b.get("history") or []
    teach = bool(b.get("teach_mode"))
    reply = website_chatbot.get_reply(msg, history, teach)
    return jsonify({"reply": reply, "teach_mode": teach})


# ==========================================
# SIMULATOR ROUTES (From backend.py)
# ==========================================

@app.route("/api/explain", methods=["POST"])
def simulator_explain():
    if not sim_chatbot_logic:
        return jsonify({"error": "Simulator AI not initialized"}), 503
        
    data = request.json
    topic = data.get("topic", "")
    if not topic:
        return jsonify({"error": "No topic provided"}), 400
    
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
        docs = sim_chatbot_logic._retrieve_docs(topic)
        context_text = "\n".join(d.page_content for d in docs[:6])

    sys_prompt = """You are a spiritual and historical AI teacher. Generate a structured explanation based ONLY on the provided context.
Return ONLY a JSON object with keys: intro, narrative, context, takeaways (array of strings), summary."""
    usr_prompt = f"Topic: {topic}\n\nContext:\n{context_text}\n\nEnsure the tone is educational, inspiring, and respectful."

    try:
        response = sim_chatbot_logic.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": usr_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        ai_text = response.choices[0].message.content.strip()
        return Response(ai_text, mimetype="application/json")
    except Exception as e:
        print(f"Error in /api/explain: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/quiz", methods=["POST"])
def simulator_quiz():
    if not sim_chatbot_logic:
        return jsonify({"error": "Simulator AI not initialized"}), 503
        
    data = request.json
    explanation = data.get("explanation", "")
    topic = data.get("topic", "")
    
    sys_prompt = f"""You are a quiz master. Based ONLY on the following explanation for the topic '{topic}', generate 3 questions. 
Return ONLY a JSON object with a 'questions' array. Each question object must have: 'type' ("mcq", "tf", or "fill"), 'question' (string), 'options' (array of strings, for mcq/tf only), and 'answer' (integer index for mcq/tf, or string for fill).
Format requirements: 1 mcq, 1 tf, 1 fill."""
    usr_prompt = f"Explanation: {explanation}"

    try:
        response = sim_chatbot_logic.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": usr_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        ai_text = response.choices[0].message.content.strip()
        return Response(ai_text, mimetype="application/json")
    except Exception as e:
        print(f"Error in /api/quiz: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/qa", methods=["POST"])
def simulator_qa():
    if not sim_chatbot_logic:
        return jsonify({"error": "Simulator AI not initialized"}), 503
        
    data = request.json
    topic = data.get("topic", "")
    question = data.get("question", "")

    base_context = ""
    try:
        with open("datasets/base_content.json", "r", encoding="utf-8") as f:
            base_data = json.load(f)
            if topic in base_data:
                base_context = base_data[topic]
    except Exception:
        pass

    docs = sim_chatbot_logic._retrieve_docs(f"{topic} {question}")
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
        response = sim_chatbot_logic.client.chat.completions.create(
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
def simulator_teacher():
    if not sim_chatbot_logic:
        return jsonify({"error": "Simulator AI not initialized"}), 503
        
    data = request.json
    topic = data.get("topic", "")
    history = data.get("history", "")

    sys_prompt = f"""You are a spiritual mentor and teacher. The student is reflecting on '{topic}'. 
1. Build on the student's thoughts with a brief encouraging statement.
2. Follow up with another thoughtful, open-ended question to keep the dialogue flowing.
3. Never grade or say answers are 'right' or 'wrong'.
Keep your response short (2-3 sentences max)."""

    try:
        response = sim_chatbot_logic.client.chat.completions.create(
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
def simulator_media():
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

@app.route("/api/simulator/chat_stream", methods=["POST"])
def simulator_chat_stream():
    if not hf_chatbot:
        return jsonify({"error": "Simulator AI not initialized"}), 503
        
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

@app.route("/api/simulator/chat", methods=["POST"])
def simulator_chat():
    if not hf_chatbot:
        return jsonify({"error": "Simulator AI not initialized"}), 503
        
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
        print(f"Error in /api/simulator/chat: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/explore_stream", methods=["POST"])
def simulator_explore_stream():
    if not hf_explorer:
        return jsonify({"error": "Simulator AI not initialized"}), 503
        
    data = request.json
    topic = data.get("topic", "")
    path = data.get("path", [])

    def event_generator():
        for event in hf_explorer.stream_explore(topic, path):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return Response(event_generator(), mimetype="text/event-stream")

# ==========================================
# STATIC FILES (Website)
# ==========================================

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_website(path):
    if path != "" and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    else:
        return send_from_directory(FRONTEND_DIR, "index.html")

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=False)
