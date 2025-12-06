import os
from typing import Optional, Dict, Any
from flask import Flask
from extensions import db, migrate, jwt
from flask_cors import CORS
from commands import seed_db_command


def create_app(test_config: Optional[Dict[str, Any]] = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)

    app.config.from_mapping(
        SECRET_KEY='dev',
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///local.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'super-secret-key-change-this'),
    )

    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions
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

    with app.app_context():
        from models import User

    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    # Register CLI command
    app.cli.add_command(seed_db_command)

    return app