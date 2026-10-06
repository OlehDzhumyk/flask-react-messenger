import pytest

from models import User


# --- Search ---

@pytest.mark.parametrize('query', ['bob@test.com', 'BOB@Test.com', '  bob@test.com  '])
def test_search_finds_user_by_exact_email(client, register, query):
    alice = register('alice')
    bob = register('bob')

    res = client.get('/api/users', query_string={'q': query}, headers=alice.headers)

    assert res.status_code == 200
    assert res.json == [{'id': bob.id, 'username': 'bob', 'email': 'bob@test.com'}]


@pytest.mark.parametrize('query', ['bob', 'bob@', '@test.com', 'bo@test.com', ''])
def test_search_does_not_match_partial_input(client, register, query):
    alice = register('alice')
    register('bob')

    res = client.get('/api/users', query_string={'q': query}, headers=alice.headers)

    assert res.status_code == 200
    assert res.json == []


def test_search_excludes_yourself(client, register):
    alice = register('alice')

    res = client.get('/api/users', query_string={'q': alice.email}, headers=alice.headers)

    assert res.json == []


# --- Profile ---

def test_get_profile(client, register):
    alice = register('alice')

    res = client.get('/api/profile', headers=alice.headers)

    assert res.status_code == 200
    assert res.json == {'id': alice.id, 'username': 'alice', 'email': 'alice@test.com'}


def test_update_profile(client, register):
    alice = register('alice')

    res = client.put('/api/profile', json={'username': ' alice2 ', 'email': 'Alice2@Test.com'},
                     headers=alice.headers)

    assert res.status_code == 200
    assert res.json['user'] == {'id': alice.id, 'username': 'alice2', 'email': 'alice2@test.com'}


def test_update_profile_keeps_fields_that_are_not_sent(client, register):
    alice = register('alice')

    client.put('/api/profile', json={'username': 'alice2'}, headers=alice.headers)

    assert client.get('/api/profile', headers=alice.headers).json['email'] == 'alice@test.com'


@pytest.mark.parametrize('field', ['username', 'email'])
def test_update_profile_rejects_taken_values(client, register, field):
    alice = register('alice')
    register('bob')
    taken = {'username': 'bob', 'email': 'bob@test.com'}[field]

    res = client.put('/api/profile', json={field: taken}, headers=alice.headers)

    assert res.status_code == 409
    assert res.json['error'] == 'Username or email already exists'


@pytest.mark.parametrize('payload', [{'email': 'nope'}, {'username': 'ab'}])
def test_update_profile_validates_input(client, register, payload):
    alice = register('alice')

    res = client.put('/api/profile', json=payload, headers=alice.headers)

    assert res.status_code == 400


# --- Account deletion ---

def test_delete_account(client, register):
    alice = register('alice')

    res = client.delete('/api/profile', headers=alice.headers)

    assert res.status_code == 200
    assert res.json['message'] == 'Account deleted successfully'
    assert User.query.filter_by(email='alice@test.com').first() is None
    login = client.post('/api/auth/login', json={'email': 'alice@test.com', 'password': 'secret123'})
    assert login.status_code == 401


def test_token_of_deleted_account_stops_working(client, register):
    alice = register('alice')
    client.delete('/api/profile', headers=alice.headers)

    res = client.get('/api/chats', headers=alice.headers)

    assert res.status_code == 401


def test_deleted_users_messages_stay_in_partners_chat(client, register, start_chat, send):
    stays = register('stays')
    leaves = register('leaves')
    chat_id = start_chat(stays, leaves)
    send(leaves, chat_id, 'goodbye')

    client.delete('/api/profile', headers=leaves.headers)

    messages = client.get(f'/api/chats/{chat_id}/messages', headers=stays.headers).json
    assert [(m['content'], m['author_id']) for m in messages] == [('goodbye', None)]
    chats = client.get('/api/chats', headers=stays.headers).json
    assert chats[0]['id'] == chat_id
    assert chats[0]['partner_id'] is None
