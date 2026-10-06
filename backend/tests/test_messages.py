from datetime import datetime

import pytest

from models import Message


@pytest.fixture
def chat(register, start_chat):
    """Alice and Bob in a chat, plus Eve who is not part of it."""
    alice = register('alice')
    bob = register('bob')
    eve = register('eve')
    return alice, bob, eve, start_chat(alice, bob)


def get_messages(client, user, chat_id, **params):
    return client.get(f'/api/chats/{chat_id}/messages', query_string=params, headers=user.headers)


# --- Sending ---

def test_send_and_read_message(client, chat):
    alice, bob, _, chat_id = chat

    res = client.post(f'/api/chats/{chat_id}/messages', json={'content': '  Hello Bob  '},
                      headers=alice.headers)

    assert res.status_code == 201
    assert res.json['content'] == 'Hello Bob'
    assert res.json['author_id'] == alice.id
    assert res.json['chat_id'] == chat_id
    assert [m['content'] for m in get_messages(client, bob, chat_id).json] == ['Hello Bob']


def test_timestamps_are_utc_with_offset(client, chat, send):
    alice, _, _, chat_id = chat

    message = send(alice, chat_id, 'hi')

    # An explicit offset stops browsers from reading the time as local time
    assert datetime.fromisoformat(message['timestamp']).utcoffset().total_seconds() == 0


@pytest.mark.parametrize('payload', [{}, {'content': ''}, {'content': '   '}, {'content': 42}])
def test_send_rejects_empty_content(client, chat, payload):
    alice, _, _, chat_id = chat

    res = client.post(f'/api/chats/{chat_id}/messages', json=payload, headers=alice.headers)

    assert res.status_code == 400
    assert res.json['error'] == 'Message content is required'


def test_send_to_unknown_chat(client, chat):
    alice, *_ = chat

    res = client.post('/api/chats/9999/messages', json={'content': 'hi'}, headers=alice.headers)

    assert res.status_code == 404


# --- Access control ---

def test_outsider_cannot_read_or_write_chat(client, chat, send):
    alice, _, eve, chat_id = chat
    send(alice, chat_id, 'private')

    read = get_messages(client, eve, chat_id)
    write = client.post(f'/api/chats/{chat_id}/messages', json={'content': 'hi'}, headers=eve.headers)

    assert read.status_code == write.status_code == 403
    assert read.json['error'] == 'Access denied'


# --- History and polling ---

@pytest.fixture
def ten_messages(chat, send):
    alice, bob, _, chat_id = chat
    ids = [send(alice if i % 2 else bob, chat_id, f'msg {i}')['id'] for i in range(10)]
    return alice, chat_id, ids


def test_initial_load_returns_latest_page_oldest_first(client, ten_messages):
    alice, chat_id, ids = ten_messages

    res = get_messages(client, alice, chat_id, limit=3)

    assert [m['id'] for m in res.json] == ids[-3:]


def test_scrolling_back_with_before_id(client, ten_messages):
    alice, chat_id, ids = ten_messages

    res = get_messages(client, alice, chat_id, limit=3, before_id=ids[-3])

    assert [m['id'] for m in res.json] == ids[-6:-3]


def test_polling_with_after_id_returns_only_new_messages(client, ten_messages):
    alice, chat_id, ids = ten_messages

    res = get_messages(client, alice, chat_id, after_id=ids[4])

    assert [m['id'] for m in res.json] == ids[5:]
    assert get_messages(client, alice, chat_id, after_id=ids[-1]).json == []


def test_polling_after_long_gap_is_paged_without_gaps(client, ten_messages):
    alice, chat_id, ids = ten_messages

    first = get_messages(client, alice, chat_id, after_id=0, limit=4).json
    second = get_messages(client, alice, chat_id, after_id=first[-1]['id'], limit=100).json

    assert [m['id'] for m in first + second] == ids


@pytest.mark.parametrize('limit, expected', [(0, 1), (-5, 1), (1000, 100)])
def test_limit_is_clamped(client, chat, app, limit, expected):
    alice, _, _, chat_id = chat
    Message.query.session.add_all(Message(content=str(i), user_id=alice.id, chat_id=chat_id) for i in range(120))
    Message.query.session.commit()

    res = get_messages(client, alice, chat_id, limit=limit)

    assert len(res.json) == expected


# --- Editing and deleting ---

def test_edit_own_message(client, chat, send):
    alice, bob, _, chat_id = chat
    message = send(alice, chat_id, 'Original')

    res = client.put(f"/api/messages/{message['id']}", json={'content': 'Edited'}, headers=alice.headers)

    assert res.status_code == 200
    assert res.json['content'] == 'Edited'
    assert get_messages(client, bob, chat_id).json[0]['content'] == 'Edited'


def test_edit_rejects_empty_content(client, chat, send):
    alice, _, _, chat_id = chat
    message = send(alice, chat_id, 'Original')

    res = client.put(f"/api/messages/{message['id']}", json={'content': '  '}, headers=alice.headers)

    assert res.status_code == 400


def test_delete_own_message(client, chat, send):
    alice, bob, _, chat_id = chat
    message = send(alice, chat_id, 'Oops')

    res = client.delete(f"/api/messages/{message['id']}", headers=alice.headers)

    assert res.status_code == 200
    assert res.json['message'] == 'Message deleted'
    assert get_messages(client, bob, chat_id).json == []


@pytest.mark.parametrize('method', ['put', 'delete'])
def test_cannot_change_someone_elses_message(client, chat, send, method):
    alice, bob, _, chat_id = chat
    message = send(alice, chat_id, 'Mine')

    res = getattr(client, method)(f"/api/messages/{message['id']}", json={'content': 'Hacked'},
                                  headers=bob.headers)

    assert res.status_code == 403
    assert get_messages(client, alice, chat_id).json[0]['content'] == 'Mine'


@pytest.mark.parametrize('method', ['put', 'delete'])
def test_change_unknown_message(client, chat, method):
    alice, *_ = chat

    res = getattr(client, method)('/api/messages/9999', json={'content': 'x'}, headers=alice.headers)

    assert res.status_code == 404
