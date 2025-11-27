from app import db


class User(db.Model):
    """
    User model for storing account credentials.

    Schema defined in project requirements:
    - id: Primary Key
    - username: Unique identifier
    - email: Unique contact info
    - password_hash: Securely stored password
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'