import json
from app import db
from models import User

def get_auth_header(client, email, password):
    """
    Helper function to log in a user and return the Authorization header.
    """
    response = client.post('/api/auth/login', json={
        'email': email,
        'password': password
    })

    if response.status_code != 200:
        raise RuntimeError(f"Login failed for {email}. Status: {response.status_code}, Body: {response.json}")

    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}

def test_search_users(client, app):
    """
    GIVEN registered users 'alice' and 'alex'
    WHEN a user searches
    THEN partial matches should return nothing (security),
    AND exact email matches should return the user.
    """
    # 1. Setup
    client.post('/api/auth/register', json={'username': 'alice', 'email': 'alice@test.com', 'password': 'pw'})
    client.post('/api/auth/register', json={'username': 'alex', 'email': 'alex@test.com', 'password': 'pw'})
    # Bob is the searcher
    client.post('/api/auth/register', json={'username': 'bob', 'email': 'bob@test.com', 'password': 'pw'})

    # Login as bob using the helper from utils
    headers = get_auth_header(client, 'bob@test.com', 'pw')

    # 2. Test Partial Search (Security Requirement: Should fail to find users)
    response_partial = client.get('/api/users?q=al', headers=headers)
    assert response_partial.status_code == 200
    assert len(response_partial.json) == 0  # Should be empty now!

    # 3. Test Exact Email Search (Functional Requirement)
    response_exact = client.get('/api/users?q=alice@test.com', headers=headers)
    assert response_exact.status_code == 200
    data = response_exact.json

    assert len(data) == 1
    assert data[0]['email'] == 'alice@test.com'
    assert data[0]['username'] == 'alice'


def test_delete_account(client, app):
    """
    GIVEN a registered user
    WHEN they send a DELETE request to /api/profile
    THEN their account and data should be removed.
    """
    # 1. Setup
    client.post('/api/auth/register', json={'username': 'todelete', 'email': 'del@test.com', 'password': 'pw'})
    headers = get_auth_header(client, 'del@test.com', 'pw')

    # 2. Delete Account
    response = client.delete('/api/profile', headers=headers)
    assert response.status_code == 200
    assert response.json['message'] == "Account deleted successfully"

    # 3. Verify deletion in DB
    with app.app_context():
        user = User.query.filter_by(email='del@test.com').first()
        assert user is None

    # 4. Verify login fails
    login_res = client.post('/api/auth/login', json={'email': 'del@test.com', 'password': 'pw'})
    assert login_res.status_code == 401