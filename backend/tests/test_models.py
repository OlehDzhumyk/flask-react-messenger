from app import db
from models import User, Chat, Message


def test_new_user_creation(app):
    """
    GIVEN the User model
    WHEN a new User instance is created
    THEN the user should have correct attributes.
    """
    user = User(
        username="testuser",
        email="test@test.com",
        password_hash="hashed_secret"
    )
    db.session.add(user)
    db.session.commit()

    assert user.id is not None
    assert user.username == "testuser"


def test_chat_creation_and_relationships(app):
    """
    GIVEN a User and a Chat model
    WHEN a new chat is created with participants
    THEN the relationship should be accessible from both sides.
    """
    with app.app_context():
        user1 = User(username="alice", email="alice@test.com", password_hash="hash")
        user2 = User(username="bob", email="bob@test.com", password_hash="hash")

        db.session.add_all([user1, user2])
        db.session.commit()

        chat = Chat()
        chat.participants.append(user1)
        chat.participants.append(user2)

        db.session.add(chat)
        db.session.commit()

        assert chat.id is not None
        assert len(chat.participants) == 2
        # Refresh inputs from DB session
        assert user1 in chat.participants
        assert user2 in chat.participants


def test_message_creation(app):
    """
    GIVEN a Chat and a User
    WHEN a message is sent to the chat
    THEN the message should be stored with correct references.
    """
    with app.app_context():
        user = User(username="sender", email="sender@test.com", password_hash="hash")
        chat = Chat()
        chat.participants.append(user)

        db.session.add_all([user, chat])
        db.session.commit()

        msg = Message(content="Hello World", author=user, chat=chat)
        db.session.add(msg)
        db.session.commit()

        assert msg.id is not None
        assert msg.content == "Hello World"
        assert msg.chat_id == chat.id
        assert msg.user_id == user.id