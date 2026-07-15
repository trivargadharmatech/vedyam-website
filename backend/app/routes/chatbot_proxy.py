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
