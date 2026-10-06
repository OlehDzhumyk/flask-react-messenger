from types import SimpleNamespace

import pytest
from flask import Flask

from app import create_app, db

PASSWORD = 'secret123'


@pytest.fixture
def app() -> Flask:
    """A fresh app with an in-memory SQLite database for every test."""
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    })

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app: Flask):
    return app.test_client()


@pytest.fixture
def register(client):
    """Register and log in a user; returns an object with id, email and auth headers."""
    def _register(username, email=None, password=PASSWORD):
        email = email or f'{username}@test.com'
        res = client.post('/api/auth/register',
                          json={'username': username, 'email': email, 'password': password})
        assert res.status_code == 201, res.json

        login = client.post('/api/auth/login', json={'email': email, 'password': password})
        assert login.status_code == 200, login.json
        return SimpleNamespace(
            id=login.json['user']['id'],
            email=email,
            headers={'Authorization': f"Bearer {login.json['access_token']}"},
        )
    return _register


@pytest.fixture
def start_chat(client):
    """Start a chat from one registered user to another; returns the chat id."""
    def _start_chat(sender, recipient):
        res = client.post('/api/chats', json={'recipient_id': recipient.id}, headers=sender.headers)
        assert res.status_code in (200, 201), res.json
        return res.json['id']
    return _start_chat


@pytest.fixture
def send(client):
    """Send a message as a user; returns the created message."""
    def _send(user, chat_id, content):
        res = client.post(f'/api/chats/{chat_id}/messages', json={'content': content}, headers=user.headers)
        assert res.status_code == 201, res.json
        return res.json
    return _send
