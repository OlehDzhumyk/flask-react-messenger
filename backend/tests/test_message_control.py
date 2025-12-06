import json
from app import db
from models import Message, User, Chat


def get_auth_header(client, email, password):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    return {'Authorization': f'Bearer {res.json["access_token"]}'}


def test_edit_and_delete_message(client, app):
    """
    GIVEN a chat with a message
    WHEN the author attempts to edit and then delete the message
    THEN the operations should succeed and persist in the DB.
    """
    # 1. Setup Users
    client.post('/api/auth/register', json={'username': 'editor', 'email': 'edit@test.com', 'password': 'pw'})
    headers = get_auth_header(client, 'edit@test.com', 'pw')

    # 2. Setup Chat & Message via DB (faster than API calls)
    with app.app_context():
        user = User.query.filter_by(email='edit@test.com').first()
        chat = Chat()
        chat.participants.append(user)
        msg = Message(content="Original Content", author=user, chat=chat)
        db.session.add(chat)
        db.session.add(msg)
        db.session.commit()
        msg_id = msg.id
        chat_id = chat.id

    # 3. Test EDIT (PUT)
    edit_payload = {'content': 'Updated Content'}
    res_edit = client.put(f'/api/messages/{msg_id}', json=edit_payload, headers=headers)

    assert res_edit.status_code == 200
    assert res_edit.json['content'] == 'Updated Content'

    # 4. Test DELETE (DELETE)
    res_delete = client.delete(f'/api/messages/{msg_id}', headers=headers)

    assert res_delete.status_code == 200
    assert res_delete.json['message'] == 'Message deleted'

    # 5. Verify Deletion
    with app.app_context():
        msg_check = db.session.get(Message, msg_id)
        assert msg_check is None


def test_cannot_edit_others_message(client, app):
    """
    GIVEN a message sent by User A
    WHEN User B tries to edit it
    THEN the API should return 403 Forbidden.
    """
    # 1. Setup User A (Author) and User B (Hacker)
    client.post('/api/auth/register', json={'username': 'owner', 'email': 'owner@test.com', 'password': 'pw'})
    client.post('/api/auth/register', json={'username': 'hacker', 'email': 'hacker@test.com', 'password': 'pw'})

    hacker_headers = get_auth_header(client, 'hacker@test.com', 'pw')

    # 2. Setup Message by Owner
    with app.app_context():
        owner = User.query.filter_by(email='owner@test.com').first()
        chat = Chat()
        chat.participants.append(owner)
        msg = Message(content="My Data", author=owner, chat=chat)
        db.session.add(chat)
        db.session.add(msg)
        db.session.commit()
        msg_id = msg.id

    # 3. Hacker tries to edit
    res = client.put(f'/api/messages/{msg_id}', json={'content': 'Hacked'}, headers=hacker_headers)

    assert res.status_code == 403