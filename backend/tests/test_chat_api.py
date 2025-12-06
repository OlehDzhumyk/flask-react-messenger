import json
from app import db
from models import User


def get_auth_header(client, email, password):
    """Helper function to get JWT token for requests."""
    response = client.post(
        '/api/auth/login',
        data=json.dumps({'email': email, 'password': password}),
        content_type='application/json'
    )
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}


def test_create_chat_and_send_message(client, app):
    """
    GIVEN two registered users
    WHEN User A creates a chat with User B and sends a message
    THEN the message should be retrievable via the API.
    """
    # 1. Setup: Create two users
    u1_creds = {'username': 'userA', 'email': 'a@test.com', 'password': 'password'}
    u2_creds = {'username': 'userB', 'email': 'b@test.com', 'password': 'password'}

    client.post('/api/auth/register', json=u1_creds)
    client.post('/api/auth/register', json=u2_creds)

    # 2. Login as User A to get token
    auth_headers = get_auth_header(client, u1_creds['email'], u1_creds['password'])

    # 3. Create Chat (POST /api/chats)
    with app.app_context():
        user_b = User.query.filter_by(email='b@test.com').first()
        user_b_id = user_b.id

    chat_payload = {'recipient_id': user_b_id}
    chat_response = client.post(
        '/api/chats',
        data=json.dumps(chat_payload),
        content_type='application/json',
        headers=auth_headers
    )

    assert chat_response.status_code == 201
    chat_id = chat_response.json['chat_id']

    # 4. Send Message (POST /api/chats/<id>/messages)
    msg_payload = {'content': 'Hello from User A'}
    msg_response = client.post(
        f'/api/chats/{chat_id}/messages',
        data=json.dumps(msg_payload),
        content_type='application/json',
        headers=auth_headers
    )
    assert msg_response.status_code == 201

    # 5. Get Messages (GET /api/chats/<id>/messages)
    get_response = client.get(
        f'/api/chats/{chat_id}/messages',
        headers=auth_headers
    )

    assert get_response.status_code == 200
    messages = get_response.json
    assert len(messages) == 1
    assert messages[0]['content'] == 'Hello from User A'
    assert messages[0]['author_id'] is not None


# Fixed indentation: This function is now at the top level
def test_get_user_chats(client, app):
    """
    GIVEN a user with an existing chat
    WHEN GET /api/chats is called
    THEN it should return the list of chats with partner info.
    """
    # 1. Setup users
    u1 = {'username': 'me', 'email': 'me@test.com', 'password': 'pass'}
    u2 = {'username': 'partner', 'email': 'partner@test.com', 'password': 'pass'}

    client.post('/api/auth/register', json=u1)
    client.post('/api/auth/register', json=u2)

    auth_headers = get_auth_header(client, u1['email'], u1['password'])

    # 2. Create Chat
    with app.app_context():
        u2_db = User.query.filter_by(email='partner@test.com').first()
        u2_id = u2_db.id

    client.post(
        '/api/chats',
        json={'recipient_id': u2_id},
        headers=auth_headers
    )

    # 3. Get Chats
    response = client.get('/api/chats', headers=auth_headers)

    # This assertion is expected to FAIL (405 or 404) initially
    assert response.status_code == 200
    data = response.json
    assert isinstance(data, list)
    assert len(data) == 1
    # Critical: check if we get the partner's name for the UI
    assert data[0]['partner_username'] == 'partner'