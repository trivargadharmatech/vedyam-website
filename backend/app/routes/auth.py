from flask import Blueprint, request, jsonify
from app.models.user import User
from app import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import re
import time

auth_bp = Blueprint('auth', __name__)

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
