from flask import Blueprint, jsonify
from app.config import Config

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
@health_bp.route('/', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "ok": True,
        "app": Config.APP_NAME
    }), 200
