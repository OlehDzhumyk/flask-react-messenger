import pytest
from app import create_app


def test_config():
    """
    GIVEN the app is created with test config
    WHEN the app is initialized
    THEN the configuration should reflect the testing environment
    """
    # Create app with TESTING flag explicitly set to True
    app = create_app({"TESTING": True})

    # Check that TESTING mode is active
    assert app.config["TESTING"] is True

    # Check that SECRET_KEY is not the default 'dev' key when in testing (if we set it)
    # or simply check that we can override configs.
    # For MVP, let's ensure the default mapping works.
    assert app.config["SECRET_KEY"] == "dev"


def test_hello(client):
    """
    GIVEN a running app
    WHEN the '/hello' route is requested
    THEN it should return 'Hello, World!'
    """
    # This assumes we will add a simple route to verify the app runs
    response = client.get('/hello')
    assert response.data == b'Hello, World!'