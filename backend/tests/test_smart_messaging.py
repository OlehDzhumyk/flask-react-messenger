from app import db
from models import User, Chat, Message


def get_auth_header(client, email, password):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    return {'Authorization': f'Bearer {res.json["access_token"]}'}


def test_pagination_and_delta_updates(client, app):
    """
    GIVEN a chat with 10 messages
    WHEN filtering by 'after_id' or using 'limit'
    THEN return correct subset of messages.
    """
    # 1. Setup Data
    client.post('/api/auth/register', json={'username': 'paginator', 'email': 'page@test.com', 'password': 'pw'})
    headers = get_auth_header(client, 'page@test.com', 'pw')

    with app.app_context():
        user = User.query.filter_by(email='page@test.com').first()
        chat = Chat()
        chat.participants.append(user)
        db.session.add(chat)
        db.session.commit()
        chat_id = chat.id

        # Create 10 messages with predictable IDs
        for i in range(10):
            msg = Message(content=f"Msg {i}", author=user, chat=chat)
            db.session.add(msg)
        db.session.commit()

        # Get ID of the 5th message for delta testing
        fifth_msg_id = chat.messages[4].id

    # 2. Test LIMIT (Pagination) - Get last 3 messages
    # Note: Our API should probably return latest messages by default
    res_limit = client.get(f'/api/chats/{chat_id}/messages?limit=3', headers=headers)
    assert res_limit.status_code == 200
    assert len(res_limit.json) == 3
    # Check if we got the messages (assuming order is preserved)

    # 3. Test AFTER_ID (Delta Update) - Get messages after 5th
    res_delta = client.get(f'/api/chats/{chat_id}/messages?after_id={fifth_msg_id}', headers=headers)
    assert res_delta.status_code == 200
    # Should get messages 6, 7, 8, 9, 10 (Total 5)
    assert len(res_delta.json) == 5
    assert res_delta.json[0]['id'] > fifth_msg_id