from flask import Blueprint, request, jsonify
from app.models.user import User
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user', __name__)

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
