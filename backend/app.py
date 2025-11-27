import os
from typing import Optional, Dict, Any
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize extensions globally so they can be imported by models.
# They remain unconfigured until init_app is called in the factory.
db = SQLAlchemy()
migrate = Migrate()


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
        # Fallback to sqlite if DATABASE_URL is not set (e.g. locally without docker)
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///local.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions with the app context
    db.init_app(app)
    migrate.init_app(app, db)

    # Register models to ensure SQLAlchemy is aware of them.
    # We import here to avoid circular dependencies (since models import db from app).
    with app.app_context():
        from models import User

    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    return app