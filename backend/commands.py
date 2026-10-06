import random
from datetime import datetime, timedelta, timezone

import click
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash

from extensions import db
from models import User, Chat, Message, user_chat_association

DEMO_PASSWORD = 'password'

# (name, conversation with Alice: list of (sender, text) where sender is 'alice' or 'them')
SHORT_CONVERSATIONS = [
    ('Charlie', [('alice', 'Welcome Charlie!'), ('them', 'Thanks! Glad to be here.')]),
    ('Diana', [('them', 'Are we still on for lunch tomorrow?'), ('alice', 'Yes, 12:30 works for me.')]),
    ('Ethan', [('them', 'I sent you the slides for Monday.'), ('alice', 'Got them, thanks!')]),
    ('Fiona', [('alice', 'How was the conference?'), ('them', 'Great talks on distributed systems.')]),
    ('George', [('them', 'Can you share the API docs link?'), ('alice', 'It is /apidocs on the backend.')]),
    ('Hannah', [('alice', 'Happy birthday! 🎉'), ('them', 'Thank you!!')]),
    ('Ivan', [('them', 'The build is green again.'), ('alice', 'Nice, what was wrong?'),
              ('them', 'A pinned dependency.')]),
    ('Julia', [('alice', 'Do you have time for a quick review?'), ('them', 'Sure, send it over.')]),
]

LONG_CONVERSATION = [
    "Did you push the latest changes?",
    "Yes, they're on the develop branch.",
    "Can you review my PR when you get a chance?",
    "Looking at it now.",
    "The pagination logic is tricky but it works.",
    "Scrolling back through history keeps the position now.",
    "Docker containers are up and running.",
    "Let's schedule a demo for Friday.",
    "Don't forget to update the documentation.",
    "Authentication flow looks solid.",
    "This is a longer message to check how text wrapping works. "
    "It should still look tidy and readable across a couple of lines.",
]


@click.command(name='seed_db')
@with_appcontext
def seed_db_command():
    """Replace all data with demo users and conversations."""
    rng = random.Random(42)  # same demo data on every run

    Message.query.delete()
    db.session.execute(user_chat_association.delete())
    Chat.query.delete()
    User.query.delete()
    db.session.commit()
    click.echo('Cleared existing data.')

    password_hash = generate_password_hash(DEMO_PASSWORD)

    def make_user(name):
        return User(username=name, email=f'{name.lower()}@test.com', password_hash=password_hash)

    alice, bob = make_user('Alice'), make_user('Bob')
    others = [(make_user(name), conversation) for name, conversation in SHORT_CONVERSATIONS]
    db.session.add_all([alice, bob] + [user for user, _ in others])

    now = datetime.now(timezone.utc)
    messages = []

    # A long conversation between Alice and Bob, ending 20 minutes ago
    gaps = [timedelta(minutes=rng.randint(5, 25)) for _ in range(100)]
    chat_with_bob = Chat(participants=[alice, bob],
                         created_at=now - timedelta(minutes=20) - sum(gaps, timedelta()))
    sent_at = chat_with_bob.created_at
    previous_text = None
    for gap in gaps:
        sent_at += gap
        author = rng.choice([alice, bob])
        text = rng.choice([t for t in LONG_CONVERSATION if t != previous_text])
        previous_text = text
        messages.append(Message(content=text, author=author,
                                chat=chat_with_bob, timestamp=sent_at))

    # Short conversations, each finishing a bit earlier than the previous one
    for index, (user, conversation) in enumerate(others):
        started = now - timedelta(days=3 + index, hours=rng.randint(0, 6))
        chat = Chat(participants=[alice, user], created_at=started)
        for offset, (sender, text) in enumerate(conversation):
            messages.append(Message(content=text, author=alice if sender == 'alice' else user,
                                    chat=chat, timestamp=started + timedelta(minutes=3 * (offset + 1))))

    # Insert in time order so message ids follow timestamps
    messages.sort(key=lambda message: message.timestamp)
    db.session.add_all(messages)
    db.session.commit()

    click.echo(f'Created {2 + len(others)} users and {len(messages)} messages '
               f'(log in as alice@test.com / {DEMO_PASSWORD}).')
