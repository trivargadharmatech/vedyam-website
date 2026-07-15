from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Register Models to ensure they are discovered by migrate
    from app import models

    # Register Blueprints
    from app.routes import auth_bp, user_bp, courses_bp, projects_bp, health_bp, chatbot_bp
    from app.payment_routes import payment_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(courses_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(chatbot_bp, url_prefix='/api')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')

    # Static file serving for the frontend
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_website(path):
        import os
        from app.config import Config
        full_path = os.path.join(Config.FRONTEND_DIR, path)
        if path != "" and os.path.exists(full_path):
            if os.path.isdir(full_path):
                return send_from_directory(Config.FRONTEND_DIR, path + "/index.html")
            return send_from_directory(Config.FRONTEND_DIR, path)
        else:
            return send_from_directory(Config.FRONTEND_DIR, "index.html")

    # Global Error Handlers
    @app.errorhandler(Exception)
    def handle_exception(e):
        return jsonify({"error": str(e)}), 500

    return app

# Instantiate the app globally so Gunicorn's app:app command can find it in this package.
app = create_app()
