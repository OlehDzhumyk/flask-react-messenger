import os
from typing import Optional, Dict, Any
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Initialize extensions globally.
# They remain unconfigured until init_app is called in the factory.
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(test_config: Optional[Dict[str, Any]] = None) -> Flask:
    """
    Application Factory Pattern.
    Creates and configures an instance of the Flask application.

    Args:
        test_config: A dictionary of configuration overrides for testing.

    Returns:
        Flask app instance.
    """
    app = Flask(__name__, instance_relative_config=True)

    # Default configuration
    app.config.from_mapping(
        SECRET_KEY='dev',
        # Fallback to sqlite if DATABASE_URL is not set
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///local.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        # JWT Configuration
        JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'super-secret-key-change-this'),
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Allow requests from any origin for routes starting with /api/
    # In production, replace "*" with the specific frontend URL (e.g., "http://localhost:3000")
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions with the app context
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register Blueprints
    from auth import bp as auth_bp
    app.register_blueprint(auth_bp)

    from chat import bp as chat_bp
    app.register_blueprint(chat_bp)

    from users import bp as users_bp
    app.register_blueprint(users_bp)

    # Register models to ensure SQLAlchemy is aware of them.
    with app.app_context():
        from models import User

    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    return app