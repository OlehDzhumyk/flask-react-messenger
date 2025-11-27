from app import db
# This import is expected to fail initially as 'models' module is not created yet.
from models import User


def test_new_user_creation(app):
    """
    GIVEN the User model
    WHEN a new User instance is created and committed to the database
    THEN the user should have a generated ID and correct attributes.
    """
    # Create a user instance strictly to test ORM mapping configuration
    user = User(
        username="testuser",
        email="test@test.com",
        password_hash="hashed_secret"
    )

    db.session.add(user)
    db.session.commit()

    # Assertions to verify the primary key generation and field mapping
    assert user.id is not None
    assert user.username == "testuser"
    assert user.email == "test@test.com"