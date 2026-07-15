from flask import Blueprint, request, jsonify
from app.models.project import Project
from app import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

projects_bp = Blueprint('projects', __name__)

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
