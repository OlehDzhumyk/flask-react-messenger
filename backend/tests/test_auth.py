import json
from app import db
from models import User


def test_register_user(client, app):
    """
    GIVEN a running app
    WHEN a valid POST request is made to /api/auth/register
    THEN a new user should be created in the database and 201 returned.
    """
    # Define the payload
    data = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "securepassword123"
    }

    # Make the request
    response = client.post(
        '/api/auth/register',
        data=json.dumps(data),
        content_type='application/json'
    )

    # Check the response status code
    assert response.status_code == 201

    # Check the response body
    assert response.json["message"] == "User created successfully"

    # Verify user exists in the database context
    with app.app_context():
        user = User.query.filter_by(email="new@example.com").first()
        assert user is not None
        assert user.username == "newuser"
        # Ensure password is NOT stored in plain text
        assert user.password_hash != "securepassword123"


def test_register_existing_user(client):
    """
    GIVEN an existing user in the database
    WHEN a POST request is made to /api/auth/register with the same email
    THEN the API should return 409 Conflict.
    """
    # First, create a user directly in the DB (setup phase)
    # We use the client to do this via API for simplicity,
    # or we could insert directly via db.session if we wanted pure unit isolation.
    data = {
        "username": "existing",
        "email": "existing@example.com",
        "password": "password"
    }
    client.post('/api/auth/register', json=data)

    # Try to register again with same email
    response = client.post('/api/auth/register', json=data)

    assert response.status_code == 409
    assert "User already exists" in response.json["error"]


def test_register_validation(client):
    """
    GIVEN a registration payload missing a required field (password)
    WHEN the request is sent
    THEN the API should return 400 Bad Request.
    """
    data = {
        "username": "incomplete",
        "email": "incomplete@example.com"
        # Missing password
    }

    response = client.post('/api/auth/register', json=data)

    assert response.status_code == 400
    assert "Password is required" in response.json["error"]