import json
from app import db
from models import User


def get_auth_header(client, email, password):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    return {'Authorization': f'Bearer {res.json["access_token"]}'}


def test_create_chat_with_nonexistent_user(client, app):
    """
    GIVEN a logged in user
    WHEN they try to create a chat with a user ID that doesn't exist
    THEN return 404 Not Found.
    """
    # Setup
    client.post('/api/auth/register', json={'username': 'u1', 'email': 'u1@t.com', 'password': 'pw'})
    headers = get_auth_header(client, 'u1@t.com', 'pw')

    # Action: Try to chat with ID 9999
    res = client.post('/api/chats', json={'recipient_id': 9999}, headers=headers)

    # Assert
    assert res.status_code == 404
    assert 'Recipient not found' in res.json['error']


def test_create_chat_with_self(client, app):
    """
    GIVEN a logged in user
    WHEN they try to create a chat with themselves
    THEN return 400 Bad Request.
    """
    # Setup
    client.post('/api/auth/register', json={'username': 'u2', 'email': 'u2@t.com', 'password': 'pw'})
    headers = get_auth_header(client, 'u2@t.com', 'pw')

    # Get own ID
    with app.app_context():
        u2 = User.query.filter_by(email='u2@t.com').first()
        my_id = u2.id

    # Action
    res = client.post('/api/chats', json={'recipient_id': my_id}, headers=headers)

    # Assert
    assert res.status_code == 400
    assert 'Cannot chat with yourself' in res.json['error']


def test_send_empty_message(client, app):
    """
    GIVEN a valid chat
    WHEN a user tries to send an empty message string
    THEN return 400 Bad Request.
    """
    # Setup Users and Chat
    client.post('/api/auth/register', json={'username': 'u3', 'email': 'u3@t.com', 'password': 'pw'})
    client.post('/api/auth/register', json={'username': 'u4', 'email': 'u4@t.com', 'password': 'pw'})
    headers = get_auth_header(client, 'u3@t.com', 'pw')

    with app.app_context():
        u4 = User.query.filter_by(email='u4@t.com').first()
        u4_id = u4.id

    # Create chat
    chat_res = client.post('/api/chats', json={'recipient_id': u4_id}, headers=headers)
    chat_id = chat_res.json['chat_id']

    # Action: Send empty content
    res = client.post(f'/api/chats/{chat_id}/messages', json={'content': ''}, headers=headers)

    # Assert
    assert res.status_code == 400
    assert 'Message content is required' in res.json['error']


def test_unauthorized_access(client):
    """
    GIVEN a protected endpoint
    WHEN a request is made without a token
    THEN return 401 Unauthorized.
    """
    res = client.get('/api/chats')
    assert res.status_code == 401
    assert 'Missing Authorization Header' in res.json['msg']