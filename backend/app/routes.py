from app import db
from app import db, bcrypt
from app.config import Config
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.project import Project
from app.models.user import User
from flask import Blueprint, jsonify
from flask import Blueprint, request, jsonify
from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import verify_jwt_in_request
import json
import re
import requests
import time

# --- Blueprints ---
auth_bp = Blueprint('auth', __name__)
chatbot_bp = Blueprint('chatbot', __name__)
courses_bp = Blueprint('courses', __name__)
health_bp = Blueprint('health', __name__)
projects_bp = Blueprint('projects', __name__)
user_bp = Blueprint('user', __name__)

# --- Routes ---


@auth_bp.route('/register', methods=['POST'])
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
        
    exists = User.query.filter_by(email=email).first()
    if exists:
        return jsonify({"error": "An account with this email already exists"}), 409
        
    hashed_password = bcrypt.generate_password_hash(pw).decode('utf-8')
    new_user = User(
        name=name,
        email=email,
        password=hashed_password,
        role=role,
        bio=""
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    access_token = create_access_token(identity=new_user.id)
    return jsonify({"token": access_token, "user": new_user.to_json()})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    pw = data.get("password") or ""
    
    user = User.query.filter_by(email=email).first()
    if not user or not user.password or not bcrypt.check_password_hash(user.password, pw):
        return jsonify({"error": "Incorrect email or password"}), 401
        
    user.last_login = int(time.time())
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify({"token": access_token, "user": user.to_json()})

@auth_bp.route('/google', methods=['POST'])
def google_auth():
    # Placeholder for actual Google verification
    # Needs to verify id_token and create/login user
    data = request.json or {}
    email = data.get("email")
    name = data.get("name")
    
    if not email:
         return jsonify({"error": "Google email missing"}), 400
         
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(name=name or "Google User", email=email, provider='google', role='user', bio="")
        db.session.add(user)
    
    user.last_login = int(time.time())
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify({"token": access_token, "user": user.to_json()})


# List of endpoints to proxy to Hugging Face
PROXY_ROUTES = [
    '/chat', 
    '/simulator/chat', 
    '/explain', 
    '/quiz', 
    '/qa', 
    '/teacher', 
    '/website/chat',
    '/media'
]

def proxy_request(path):
    target_url = f"{Config.HF_CHATBOT_URL}/api{path}"
    
    try:
        # Only forward safe headers
        safe_headers = {'Content-Type': request.headers.get('Content-Type', 'application/json')}
        
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers=safe_headers,
            json=request.get_json(silent=True),
            stream=False,
            timeout=30
        )
        
        # Exclude connection headers
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in resp.raw.headers.items()
                   if name.lower() not in excluded_headers]

        return Response(resp.content, resp.status_code, headers)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to reach chatbot service: {str(e)}"}), 503

@chatbot_bp.route('/chat', methods=['POST', 'GET'])
def proxy_chat():
    return proxy_request('/chat')

@chatbot_bp.route('/simulator/chat', methods=['POST', 'GET'])
def proxy_simulator_chat():
    # HF space doesn't have /simulator/chat, it only has /chat
    return proxy_request('/chat')

@chatbot_bp.route('/explain', methods=['POST', 'GET'])
def proxy_explain():
    return proxy_request('/explain')
    
@chatbot_bp.route('/quiz', methods=['POST', 'GET'])
def proxy_quiz():
    return proxy_request('/quiz')

@chatbot_bp.route('/qa', methods=['POST', 'GET'])
def proxy_qa():
    return proxy_request('/qa')

@chatbot_bp.route('/teacher', methods=['POST', 'GET'])
def proxy_teacher():
    return proxy_request('/teacher')
    
@chatbot_bp.route('/website/chat', methods=['POST', 'GET'])
def proxy_website_chat():
    return proxy_request('/website/chat')
    
@chatbot_bp.route('/media', methods=['POST', 'GET'])
def proxy_media():
    return proxy_request('/media')

# Streaming routes
def proxy_stream(path):
    target_url = f"{Config.HF_CHATBOT_URL}/api{path}"
    
    try:
        safe_headers = {'Content-Type': request.headers.get('Content-Type', 'application/json')}
        req = requests.post(
            target_url,
            headers=safe_headers,
            json=request.get_json(silent=True),
            stream=True,
            timeout=30
        )
        
        def generate():
            # Read in chunks of 1 byte to prevent any buffering delay
            for chunk in req.iter_content(chunk_size=1):
                if chunk:
                    yield chunk
                    
        return Response(stream_with_context(generate()), content_type=req.headers.get('content-type', 'text/event-stream'))
    except Exception as e:
        return jsonify({"error": f"Failed to reach streaming service: {str(e)}"}), 503

@chatbot_bp.route('/chat_stream', methods=['POST'])
def proxy_chat_stream():
    return proxy_stream('/chat_stream')
    
@chatbot_bp.route('/simulator/chat_stream', methods=['POST'])
def proxy_simulator_chat_stream():
    # HF space doesn't have /simulator/chat_stream, it only has /chat_stream
    return proxy_stream('/chat_stream')

@chatbot_bp.route('/explore_stream', methods=['POST'])
def proxy_explore_stream():
    return proxy_stream('/explore_stream')


@courses_bp.route('/courses', methods=['GET', 'POST'])
def courses():
    if request.method == 'GET':
        courses = Course.query.filter_by(status='approved').order_by(Course.created_at.desc()).all()
        return jsonify({"courses": [c.to_json() for c in courses]})
        
    elif request.method == 'POST':
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role not in ("instructor", "superadmin"):
            return jsonify({"error": "You do not have access to this action"}), 403
            
        b = request.json or {}
        title = (b.get("title") or "").strip()
        if not title:
            return jsonify({"error": "A course title is required"}), 400
            
        lessons = b.get("lessons") or []
        if isinstance(lessons, str):
            lessons = [s.strip() for s in lessons.split("\n") if s.strip()]
            
        new_course = Course(
            title=title,
            category=b.get("category") or "Wisdom",
            level=b.get("level") or "Foundation",
            duration=b.get("duration") or "4 weeks",
            summary=b.get("summary") or "",
            description=b.get("description") or "",
            lessons=json.dumps(lessons),
            accent=b.get("accent") or "indigo",
            instructor_id=user.id,
            status="proposed"
        )
        
        db.session.add(new_course)
        db.session.commit()
        
        return jsonify({"course": new_course.to_json()})

@courses_bp.route('/my-courses', methods=['GET'])
@jwt_required()
def my_courses():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role not in ("instructor", "superadmin"):
        return jsonify({"error": "You do not have access to this action"}), 403
        
    courses = Course.query.filter_by(instructor_id=user_id).order_by(Course.created_at.desc()).all()
    return jsonify({"courses": [c.to_json() for c in courses]})

@courses_bp.route('/admin/pending', methods=['GET'])
@courses_bp.route('/admin/courses', methods=['GET'])
@jwt_required()
def pending_courses():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != "superadmin":
        return jsonify({"error": "You do not have access to this action"}), 403
        
    courses = Course.query.filter_by(status='proposed').order_by(Course.created_at.asc()).all()
    return jsonify({"courses": [c.to_json() for c in courses]})

@courses_bp.route('/course/<int:cid>', methods=['GET'])
def get_course(cid):
    course = Course.query.get(cid)
    if not course:
        return jsonify({"error": "Course not found"}), 404
        
    if course.status != "approved":
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or (user.role != "superadmin" and user.id != course.instructor_id):
                return jsonify({"error": "Course not found"}), 404
        except:
            return jsonify({"error": "Course not found"}), 404
            
    return jsonify({"course": course.to_json()})

@courses_bp.route('/course/<int:cid>/review', methods=['POST'])
@jwt_required()
def review_course(cid):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != "superadmin":
        return jsonify({"error": "You do not have access to this action"}), 403
        
    b = request.json or {}
    action = b.get("action")
    if action not in ("approve", "reject"):
        return jsonify({"error": "action must be 'approve' or 'reject'"}), 400
        
    course = Course.query.get(cid)
    if not course:
        return jsonify({"error": "Course not found"}), 404
        
    course.status = "approved" if action == "approve" else "rejected"
    course.review_note = b.get("note") or ""
    db.session.commit()
    
    return jsonify({"id": cid, "status": course.status})

@courses_bp.route('/course/<int:cid>/enroll', methods=['POST'])
@jwt_required()
def enroll_course(cid):
    user_id = get_jwt_identity()
    
    course = Course.query.filter_by(id=cid, status='approved').first()
    if not course:
        return jsonify({"error": "Course not found"}), 404
        
    existing = Enrollment.query.filter_by(user_id=user_id, course_id=cid).first()
    if not existing:
        new_enrollment = Enrollment(user_id=user_id, course_id=cid, progress=0)
        db.session.add(new_enrollment)
        db.session.commit()
        
    return jsonify({"enrolled": True, "course_id": cid})

@courses_bp.route('/my-learning', methods=['GET'])
@courses_bp.route('/enrolled', methods=['GET'])
@jwt_required()
def my_learning():
    user_id = get_jwt_identity()
    enrollments = Enrollment.query.filter_by(user_id=user_id).order_by(Enrollment.created_at.desc()).all()
    
    items = []
    for e in enrollments:
        if e.course:
            d = e.course.to_json()
            d["enrollment_id"] = e.id
            d["progress"] = e.progress
            items.append(d)
            
    # Frontend app.js expects "learning" array or "courses" array based on the route
    if request.path.endswith('/enrolled'):
        return jsonify({"courses": items})
    return jsonify({"learning": items})

@courses_bp.route('/enrollment/<int:eid>/progress', methods=['POST'])
@jwt_required()
def update_progress(eid):
    user_id = get_jwt_identity()
    b = request.json or {}
    
    try:
        p = max(0, min(100, int(b.get("progress", 0))))
    except (TypeError, ValueError):
        return jsonify({"error": "progress must be a number"}), 400
        
    enrollment = Enrollment.query.filter_by(id=eid, user_id=user_id).first()
    if not enrollment:
        return jsonify({"error": "Enrollment not found"}), 404
        
    enrollment.progress = p
    db.session.commit()
    
    return jsonify({"enrollment_id": eid, "progress": p})


@health_bp.route('/health', methods=['GET'])
@health_bp.route('/', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "ok": True,
        "app": Config.APP_NAME
    }), 200


@projects_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    project_type = request.args.get('type')
    
    query = Project.query.filter_by(user_id=user_id)
    if project_type:
        query = query.filter_by(project_type=project_type)
        
    projects = query.order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_json() for p in projects]})

@projects_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.json or {}
    
    title = data.get('title', 'Untitled')
    description = data.get('description', '')
    project_type = data.get('type', 'general')
    project_data = data.get('data', {})
    
    new_project = Project(
        user_id=user_id,
        title=title,
        description=description,
        project_type=project_type,
        data=json.dumps(project_data) if isinstance(project_data, dict) else project_data
    )
    
    db.session.add(new_project)
    db.session.commit()
    
    return jsonify({"project": new_project.to_json()}), 201

@projects_bp.route('/<int:pid>', methods=['GET'])
@jwt_required()
def get_project(pid):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=pid, user_id=user_id).first()
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
        
    return jsonify({"project": project.to_json()})

@projects_bp.route('/<int:pid>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_project(pid):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=pid, user_id=user_id).first()
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
        
    data = request.json or {}
    
    if 'title' in data:
        project.title = data['title']
    if 'description' in data:
        project.description = data['description']
    if 'data' in data:
        project_data = data['data']
        project.data = json.dumps(project_data) if isinstance(project_data, dict) else project_data
    if 'type' in data:
        project.project_type = data['type']
        
    db.session.commit()
    return jsonify({"project": project.to_json()})

@projects_bp.route('/<int:pid>', methods=['DELETE'])
@jwt_required()
def delete_project(pid):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=pid, user_id=user_id).first()
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
        
    db.session.delete(project)
    db.session.commit()
    
    return jsonify({"message": "Project deleted successfully"})


@user_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_json()})

@user_bp.route('/me', methods=['PATCH'])
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.json or {}
    user.name = (data.get("name") or user.name).strip()
    user.bio = data.get("bio", user.bio) or ""
    
    db.session.commit()
    return jsonify({"user": user.to_json()})
