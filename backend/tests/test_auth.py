import pytest

from models import User

REGISTER = '/api/auth/register'
LOGIN = '/api/auth/login'


def new_user(**overrides):
    return {'username': 'newuser', 'email': 'new@example.com', 'password': 'secret123', **overrides}


# --- Registration ---

def test_register_stores_hashed_password(client, app):
    res = client.post(REGISTER, json=new_user())

    assert res.status_code == 201
    assert res.json['message'] == 'User created successfully'
    user = User.query.filter_by(email='new@example.com').one()
    assert user.username == 'newuser'
    assert user.password_hash != 'secret123'
    assert user.password_hash.startswith('scrypt:')


def test_register_normalises_email(client):
    client.post(REGISTER, json=new_user(email='  New@Example.COM '))

    assert User.query.one().email == 'new@example.com'


@pytest.mark.parametrize('duplicate', [
    {'username': 'other'},                                   # same email
    {'username': 'other', 'email': 'NEW@example.com'},       # same email, different case
    {'email': 'other@example.com'},                          # same username
])
def test_register_rejects_existing_user(client, duplicate):
    client.post(REGISTER, json=new_user())

    res = client.post(REGISTER, json=new_user(**duplicate))

    assert res.status_code == 409
    assert res.json['error'] == 'User already exists'


@pytest.mark.parametrize('missing', ['username', 'email', 'password'])
def test_register_requires_all_fields(client, missing):
    payload = new_user()
    del payload[missing]

    res = client.post(REGISTER, json=payload)

    assert res.status_code == 400
    assert res.json['error'] == 'Username, email, and password are required'


@pytest.mark.parametrize('field, value, error', [
    ('email', 'not-an-email', 'Invalid email address'),
    ('email', 'a@b', 'Invalid email address'),
    ('username', 'ab', 'Username must be 3-80 characters'),
    ('username', 'x' * 81, 'Username must be 3-80 characters'),
    ('password', '12345', 'Password must be at least 6 characters'),
])
def test_register_validates_fields(client, field, value, error):
    res = client.post(REGISTER, json=new_user(**{field: value}))

    assert res.status_code == 400
    assert res.json['error'] == error


@pytest.mark.parametrize('body', [None, 'just a string', ['a', 'list']])
def test_register_rejects_non_object_body(client, body):
    res = client.post(REGISTER, json=body)

    assert res.status_code == 400


# --- Login ---

def test_login_returns_token_and_user(client):
    client.post(REGISTER, json=new_user())

    res = client.post(LOGIN, json={'email': 'new@example.com', 'password': 'secret123'})

    assert res.status_code == 200
    assert res.json['message'] == 'Login successful'
    assert res.json['access_token']
    assert res.json['user'] == {'id': 1, 'username': 'newuser', 'email': 'new@example.com'}


def test_login_email_is_case_insensitive(client):
    client.post(REGISTER, json=new_user())

    res = client.post(LOGIN, json={'email': 'NEW@Example.com', 'password': 'secret123'})

    assert res.status_code == 200


@pytest.mark.parametrize('email, password', [
    ('new@example.com', 'wrong-password'),
    ('ghost@example.com', 'secret123'),
])
def test_login_rejects_bad_credentials(client, email, password):
    client.post(REGISTER, json=new_user())

    res = client.post(LOGIN, json={'email': email, 'password': password})

    assert res.status_code == 401
    # Same message for both cases, so the response doesn't reveal which emails exist
    assert res.json['error'] == 'Invalid email or password'


def test_login_requires_email_and_password(client):
    res = client.post(LOGIN, json={'email': 'new@example.com'})

    assert res.status_code == 400
