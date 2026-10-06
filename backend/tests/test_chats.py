import pytest


def test_start_chat(client, register):
    alice = register('alice')
    bob = register('bob')

    res = client.post('/api/chats', json={'recipient_id': bob.id}, headers=alice.headers)

    assert res.status_code == 201
    # Same shape as GET /api/chats items, so the client can open the chat immediately
    assert res.json['id'] == res.json['chat_id']
    assert res.json['partner_id'] == bob.id
    assert res.json['partner_username'] == 'bob'


def test_starting_existing_chat_returns_it(client, register, start_chat):
    alice = register('alice')
    bob = register('bob')
    chat_id = start_chat(alice, bob)

    from_alice = client.post('/api/chats', json={'recipient_id': bob.id}, headers=alice.headers)
    from_bob = client.post('/api/chats', json={'recipient_id': alice.id}, headers=bob.headers)

    assert from_alice.status_code == from_bob.status_code == 200
    assert from_alice.json['id'] == from_bob.json['id'] == chat_id
    assert from_bob.json['partner_id'] == alice.id


def test_cannot_chat_with_yourself(client, register):
    alice = register('alice')

    res = client.post('/api/chats', json={'recipient_id': alice.id}, headers=alice.headers)

    assert res.status_code == 400
    assert res.json['error'] == 'Cannot chat with yourself'


def test_cannot_chat_with_unknown_user(client, register):
    alice = register('alice')

    res = client.post('/api/chats', json={'recipient_id': 9999}, headers=alice.headers)

    assert res.status_code == 404
    assert res.json['error'] == 'Recipient not found'


@pytest.mark.parametrize('payload', [{}, {'recipient_id': None}, {'recipient_id': '2'}, {'recipient_id': True}])
def test_start_chat_requires_numeric_recipient(client, register, payload):
    alice = register('alice')
    register('bob')

    res = client.post('/api/chats', json=payload, headers=alice.headers)

    assert res.status_code == 400


def test_list_chats_includes_partner_and_last_message(client, register, start_chat, send):
    alice = register('alice')
    bob = register('bob')
    chat_id = start_chat(alice, bob)
    send(alice, chat_id, 'first')
    send(bob, chat_id, 'second')

    res = client.get('/api/chats', headers=alice.headers)

    assert res.status_code == 200
    assert len(res.json) == 1
    chat = res.json[0]
    assert (chat['id'], chat['partner_id'], chat['partner_username']) == (chat_id, bob.id, 'bob')
    assert chat['last_message']['content'] == 'second'
    assert chat['last_message']['author_id'] == bob.id


def test_list_chats_most_recent_first(client, register, start_chat, send):
    alice = register('alice')
    bob = register('bob')
    carol = register('carol')
    with_bob = start_chat(alice, bob)
    with_carol = start_chat(alice, carol)
    send(alice, with_carol, 'hi carol')
    send(bob, with_bob, 'hi alice')          # makes the chat with Bob the latest
    dave = register('dave')
    with_dave = start_chat(dave, alice)      # brand-new chat, no messages yet

    res = client.get('/api/chats', headers=alice.headers)

    assert [c['id'] for c in res.json] == [with_dave, with_bob, with_carol]
    assert res.json[0]['last_message'] is None


def test_list_chats_only_shows_your_chats(client, register, start_chat):
    alice = register('alice')
    bob = register('bob')
    eve = register('eve')
    start_chat(alice, bob)

    res = client.get('/api/chats', headers=eve.headers)

    assert res.json == []
