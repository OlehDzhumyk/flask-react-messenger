import json
from app import db
from models import User
from werkzeug.security import generate_password_hash


def test_login_successful(client, app):
    """
    GIVEN a registered user
    WHEN a POST request is made to /api/auth/login with valid credentials
    THEN the API should return 200 OK and a JWT token.
    """
    # Setup: Create a user directly in the DB
    password = "securepassword123"
    with app.app_context():
        user = User(
            username="testlogin",
            email="login@example.com",
            password_hash=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()

    # Action: Attempt login
    data = {
        "email": "login@example.com",
        "password": password
    }

    response = client.post(
        '/api/auth/login',
        data=json.dumps(data),
        content_type='application/json'
    )

    # Assertions
    assert response.status_code == 200
    assert "access_token" in response.json
    assert response.json["message"] == "Login successful"


def test_login_invalid_credentials(client, app):
    """
    GIVEN a registered user
    WHEN a POST request is made with a wrong password
    THEN the API should return 401 Unauthorized.
    """
    # Setup
    with app.app_context():
        user = User(
            username="wrongpass",
            email="wrong@example.com",
            password_hash=generate_password_hash("correct_password")
        )
        db.session.add(user)
        db.session.commit()

    # Action: Attempt login with wrong password
    data = {
        "email": "wrong@example.com",
        "password": "wrong_password"
    }

    response = client.post(
        '/api/auth/login',
        data=json.dumps(data),
        content_type='application/json'
    )

    # Assertions
    assert response.status_code == 401
    assert "Invalid email or password" in response.json["error"]


def test_login_non_existent_user(client):
    """
    GIVEN no user exists
    WHEN a POST request is made to login
    THEN the API should return 401 Unauthorized.
    """
    data = {
        "email": "ghost@example.com",
        "password": "whatever"
    }

    response = client.post(
        '/api/auth/login',
        data=json.dumps(data),
        content_type='application/json'
    )

    assert response.status_code == 401