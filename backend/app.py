import os
import logging
from datetime import timedelta
from typing import Optional, Dict, Any
from flask import Flask, request, jsonify
from extensions import db, migrate, jwt, swagger
from flask_cors import CORS
from commands import seed_db_command
from models import User

DEV_JWT_SECRET = 'insecure-development-jwt-secret-change-me'

def create_app(test_config: Optional[Dict[str, Any]] = None) -> Flask:
    """
    Application Factory Pattern.
    Creates and configures an instance of the Flask application.
    """
    app = Flask(__name__, instance_relative_config=True)

    # Setup Logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[logging.StreamHandler()]
    )

    # Configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///local.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', DEV_JWT_SECRET),
        # No refresh tokens yet, so keep sessions usable for a working day
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=int(os.environ.get('JWT_EXPIRES_HOURS', 12))),
        SWAGGER={
            'title': 'Flask-React Messenger API',
            'uiversion': 3,
            'version': '1.0.0',
            'description': 'API documentation for the Messenger application',
            'specs_route': '/apidocs/',
            'securityDefinitions': {
                'Bearer': {
                    'type': 'apiKey',
                    'name': 'Authorization',
                    'in': 'header',
                    'description': "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
                }
            }
        }
    )

    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    if app.config['JWT_SECRET_KEY'] == DEV_JWT_SECRET and not app.config.get('TESTING'):
        app.logger.warning("JWT_SECRET_KEY is not set; using an insecure development key")

    CORS(app, resources={r"/api/*": {"origins": os.environ.get('CORS_ORIGINS', '*').split(',')}})

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    swagger.init_app(app)

    # Resolve the token's user on every protected request. Tokens of deleted
    # accounts then get a 401 instead of reaching the endpoint.
    @jwt.user_lookup_loader
    def load_user(_jwt_header, jwt_data):
        return db.session.get(User, int(jwt_data['sub']))

    # Register Blueprints
    from auth import bp as auth_bp
    app.register_blueprint(auth_bp)

    # Import both blueprints from chat.py
    from chat import chat_bp, message_bp
    app.register_blueprint(chat_bp)
    app.register_blueprint(message_bp)

    from users import bp as users_bp
    app.register_blueprint(users_bp)

    # Request Logging Hook
    @app.after_request
    def log_request_info(response):
        app.logger.info(
            f"Request: {request.method} {request.path} | Status: {response.status_code}"
        )
        return response

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    # Register CLI command
    app.cli.add_command(seed_db_command)

    return app