import logging

from app import create_app


def test_config_can_be_overridden():
    app = create_app({"TESTING": True, "SECRET_KEY": "override"})

    assert app.config["TESTING"] is True
    assert app.config["SECRET_KEY"] == "override"


def test_health_check(client):
    res = client.get('/api/health')

    assert res.status_code == 200
    assert res.json == {'status': 'ok'}


def test_swagger_ui_loads(client):
    res = client.get('/apidocs/', follow_redirects=True)

    assert res.status_code == 200
    assert b'swagger' in res.data.lower()


def test_requests_are_logged(client, caplog):
    caplog.set_level(logging.INFO)

    client.get('/api/health')
    client.get('/no-such-route')

    assert "Request: GET /api/health | Status: 200" in caplog.text
    assert "Request: GET /no-such-route | Status: 404" in caplog.text


def test_protected_endpoint_requires_token(client):
    res = client.get('/api/chats')

    assert res.status_code == 401
    assert 'Missing Authorization Header' in res.json['msg']


def test_malformed_token_is_rejected(client):
    res = client.get('/api/chats', headers={'Authorization': 'Bearer not-a-jwt'})

    assert res.status_code == 422
