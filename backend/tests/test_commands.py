from commands import seed_db_command
from models import User, Chat, Message


def test_seed_creates_demo_data_and_can_be_rerun(app, client):
    runner = app.test_cli_runner()

    for _ in range(2):
        result = runner.invoke(seed_db_command)
        assert result.exit_code == 0, result.output

    assert User.query.count() == 10
    assert Chat.query.count() == 9
    assert Message.query.count() > 100

    login = client.post('/api/auth/login', json={'email': 'alice@test.com', 'password': 'password'})
    assert login.status_code == 200
    chats = client.get('/api/chats',
                       headers={'Authorization': f"Bearer {login.json['access_token']}"}).json
    assert chats[0]['partner_username'] == 'Bob'
    assert all(chat['last_message'] for chat in chats)
