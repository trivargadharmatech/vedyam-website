from flask import Blueprint, request, jsonify
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import time
import json

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('/courses', methods=['GET', 'POST'])
def courses():
    if request.method == 'GET':
        courses = Course.query.filter_by(status='approved').order_by(Course.created_at.desc()).all()
        return jsonify({"courses": [c.to_json() for c in courses]})
        
    elif request.method == 'POST':
        from flask_jwt_extended import verify_jwt_in_request
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
        from flask_jwt_extended import verify_jwt_in_request
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
