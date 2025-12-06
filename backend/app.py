import os
import logging
from typing import Optional, Dict, Any
from flask import Flask, request
from extensions import db, migrate, jwt, swagger
from flask_cors import CORS
from commands import seed_db_command

def create_app(test_config: Optional[Dict[str, Any]] = None) -> Flask:
    """
    Application Factory Pattern.
    Creates and configures an instance of the Flask application.
    """
    app = Flask(__name__, instance_relative_config=True)

    # We setup basic configuration to output to console (stdout).
    # Docker captures stdout/stderr automatically.
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[logging.StreamHandler()]
    )

    # Default configuration
    app.config.from_mapping(
        SECRET_KEY='dev',
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///local.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'super-secret-key-change-this'),
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

    # CORS Setup
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    swagger.init_app(app)

    # Register Blueprints
    from auth import bp as auth_bp
    app.register_blueprint(auth_bp)

    from chat import bp as chat_bp
    app.register_blueprint(chat_bp)

    from users import bp as users_bp
    app.register_blueprint(users_bp)

    with app.app_context():
        from models import User

    @app.after_request
    def log_request_info(response):
        """
        Log details about every request after it is processed.
        Includes Method, Path, Status Code.
        """
        app.logger.info(
            f"Request: {request.method} {request.path} | Status: {response.status_code}"
        )
        return response

    @app.route('/hello')
    def hello():
        app.logger.info("Hello endpoint was called manually")
        return 'Hello, World!'

    # Register CLI command
    app.cli.add_command(seed_db_command)

    return app