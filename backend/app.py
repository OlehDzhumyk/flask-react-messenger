import os
from typing import Optional, Dict, Any
from flask import Flask


def create_app(test_config: Optional[Dict[str, Any]] = None) -> Flask:
    """
    Application Factory Pattern.
    Creates and configures an instance of the Flask application.

    Args:
        test_config: A dictionary of configuration overrides for testing.

    Returns:
        Flask app instance.
    """
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # Default configuration
    app.config.from_mapping(
        SECRET_KEY='dev',
        # Database configuration will be added here later
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

    # A simple route to verify the setup (sanity check)
    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    return app