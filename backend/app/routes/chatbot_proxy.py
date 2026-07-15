from flask import Blueprint, request, jsonify, Response, stream_with_context
from app.config import Config
import requests

chatbot_bp = Blueprint('chatbot', __name__)

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
        # We forward JSON payload as is
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers={key: value for (key, value) in request.headers if key != 'Host'},
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
    return proxy_request('/simulator/chat')

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
        req = requests.post(
            target_url,
            json=request.get_json(silent=True),
            stream=True,
            timeout=30
        )
        return Response(stream_with_context(req.iter_content(chunk_size=1024)), content_type=req.headers.get('content-type'))
    except Exception as e:
        return jsonify({"error": f"Failed to reach streaming service: {str(e)}"}), 503

@chatbot_bp.route('/chat_stream', methods=['POST'])
def proxy_chat_stream():
    return proxy_stream('/chat_stream')
    
@chatbot_bp.route('/simulator/chat_stream', methods=['POST'])
def proxy_simulator_chat_stream():
    return proxy_stream('/simulator/chat_stream')

@chatbot_bp.route('/explore_stream', methods=['POST'])
def proxy_explore_stream():
    return proxy_stream('/explore_stream')
