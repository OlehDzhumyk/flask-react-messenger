import json
from app import db
from models import User, Chat


def get_token(client, email, password):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    return res.json['access_token']


def test_cannot_access_others_chat(client, app):
    """
    GIVEN a chat between User A and User B
    WHEN User C tries to read messages from that chat
    THEN the API should return 403 Forbidden.
    """
    # 1. Setup 3 Users
    users = [
        {'username': 'alice', 'email': 'alice@test.com', 'password': 'pw'},
        {'username': 'bob', 'email': 'bob@test.com', 'password': 'pw'},
        {'username': 'eve', 'email': 'eve@hacker.com', 'password': 'pw'}
    ]
    for u in users:
        client.post('/api/auth/register', json=u)

    # 2. Create chat between Alice and Bob
    token_alice = get_token(client, 'alice@test.com', 'pw')

    with app.app_context():
        bob = User.query.filter_by(email='bob@test.com').first()
        bob_id = bob.id

    res = client.post('/api/chats', json={'recipient_id': bob_id}, headers={'Authorization': f'Bearer {token_alice}'})
    chat_id = res.json['chat_id']

    # 3. Eve tries to access Alice-Bob chat
    token_eve = get_token(client, 'eve@hacker.com', 'pw')

    response = client.get(
        f'/api/chats/{chat_id}/messages',
        headers={'Authorization': f'Bearer {token_eve}'}
    )

    # 4. Assert Forbidden
    assert response.status_code == 403
    assert "Access denied" in response.json['error']