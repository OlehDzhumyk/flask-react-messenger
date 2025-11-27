import pytest
from flask import Flask
# We anticipate importing 'db' from app, even though it doesn't exist yet (TDD RED state).
# This import will cause the test to fail, which is the intended first step.
from app import create_app, db


@pytest.fixture
def app() -> Flask:
    """
    Create and configure a new app instance for each test.

    We use an in-memory SQLite database for unit tests to ensure:
    1. Speed: No disk I/O or network latency.
    2. Isolation: Tests do not affect the persistent development database.
    """
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False
    })

    # Push the application context so we can interact with the DB extension
    with app.app_context():
        # Create all tables defined in models
        db.create_all()
        yield app
        # Tear down the session and drop tables to ensure a clean slate for the next test
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app: Flask):
    """A test client for making HTTP requests to the app."""
    return app.test_client()