import json
from app import db
from models import User


def get_auth_header(client, email, password):
    res = client.post(
        '/api/auth/login',
        json={'email': email, 'password': password}
    )
    return {'Authorization': f'Bearer {res.json["access_token"]}'}


def test_search_users(client, app):
    """
    GIVEN registered users 'alice' and 'alex'
    WHEN a user searches for 'al'
    THEN both users should be returned.
    """
    # 1. Setup
    client.post('/api/auth/register', json={'username': 'alice', 'email': 'alice@test.com', 'password': 'pw'})
    client.post('/api/auth/register', json={'username': 'alex', 'email': 'alex@test.com', 'password': 'pw'})
    client.post('/api/auth/register', json={'username': 'bob', 'email': 'bob@test.com', 'password': 'pw'})

    # Login as bob to perform search
    headers = get_auth_header(client, 'bob@test.com', 'pw')

    # 2. Search for 'al'
    response = client.get('/api/users?q=al', headers=headers)

    # 3. Assert
    assert response.status_code == 200
    data = response.json
    assert len(data) == 2
    usernames = [u['username'] for u in data]
    assert 'alice' in usernames
    assert 'alex' in usernames
    assert 'bob' not in usernames


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