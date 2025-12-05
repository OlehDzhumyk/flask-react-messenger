from datetime import datetime, timezone
from app import db

# Association table for Many-to-Many relationship between User and Chat.
# As per requirements, this links users to their chats.
user_chat_association = db.Table(
    'participants',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('chat_id', db.Integer, db.ForeignKey('chats.id'), primary_key=True)
)


class User(db.Model):
    """
    User model for storing account credentials and profile info.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    # Relationships
    # secondary indicates the association table used for the Many-to-Many link.
    chats = db.relationship(
        'Chat',
        secondary=user_chat_association,
        back_populates='participants'
    )

    # One-to-Many: One user can write many messages
    messages = db.relationship('Message', backref='author', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'


class Chat(db.Model):
    """
    Chat model representing a conversation room.
    Supports 1-to-1 or Group chats via the participants relationship.
    """
    __tablename__ = 'chats'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    participants = db.relationship(
        'User',
        secondary=user_chat_association,
        back_populates='chats'
    )

    # Cascade delete ensures messages are removed if the chat is deleted.
    messages = db.relationship(
        'Message',
        backref='chat',
        lazy=True,
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f'<Chat {self.id}>'


class Message(db.Model):
    """
    Message model for storing individual text messages.
    Linked to both a specific Chat and a User (author).
    """
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    # Using lambda to ensure timestamp is generated at insertion time
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)

    def to_dict(self):
        """Helper to serialize message data for API responses."""
        return {
            'id': self.id,
            'content': self.content,
            'timestamp': self.timestamp.isoformat(),
            'author_id': self.user_id,
            'chat_id': self.chat_id
        }

    def __repr__(self):
        return f'<Message {self.id} in Chat {self.chat_id}>'