import click
import random
from datetime import datetime, timedelta, timezone
from flask.cli import with_appcontext
from extensions import db
from models import User, Chat, Message
from werkzeug.security import generate_password_hash

@click.command(name='seed_db')
@with_appcontext
def seed_db_command():
    """Populates the database with clean, chronological dummy data."""

    # 1. Clear existing data
    db.drop_all()
    db.create_all()
    click.echo('Initialized the database.')

    # 2. Create Core Users
    password = generate_password_hash('password')

    alice = User(username='Alice', email='alice@test.com', password_hash=password)
    bob = User(username='Bob', email='bob@test.com', password_hash=password)
    charlie = User(username='Charlie', email='charlie@test.com', password_hash=password)

    users = [alice, bob, charlie]

    # Create extra users for Sidebar testing
    extra_users = []
    for i in range(4, 15):
        u = User(
            username=f'User_{i}',
            email=f'user{i}@test.com',
            password_hash=password
        )
        extra_users.append(u)

    users.extend(extra_users)

    db.session.add_all(users)
    db.session.commit()
    click.echo(f'Created {len(users)} users (password: "password").')

    # 3. Create Chats
    # Chat 1: Alice & Bob (Main conversation)
    chat1 = Chat()
    chat1.participants.append(alice)
    chat1.participants.append(bob)

    # Chat 2: Alice & Charlie
    chat2 = Chat()
    chat2.participants.append(alice)
    chat2.participants.append(charlie)

    # Create random chats for Alice to test scrolling
    random_chats = []
    for u in extra_users:
        c = Chat()
        c.participants.append(alice)
        c.participants.append(u)
        random_chats.append(c)

    db.session.add_all([chat1, chat2] + random_chats)
    db.session.commit()
    click.echo('Created chats.')

    # 4. Create Messages (Chronologically Ordered)
    messages = []

    # Base start time: 2 days ago
    base_time = datetime.now(timezone.utc) - timedelta(days=2)

    # Initial greeting messages
    # We explicitly set timestamps to ensure order
    msg1 = Message(
        content="Hi Bob! How is the project?",
        author=alice,
        chat=chat1,
        timestamp=base_time + timedelta(minutes=1)
    )
    msg2 = Message(
        content="Hey Alice. It is going well!",
        author=bob,
        chat=chat1,
        timestamp=base_time + timedelta(minutes=5)
    )
    msg3 = Message(
        content="Welcome Charlie!",
        author=alice,
        chat=chat2,
        timestamp=base_time + timedelta(minutes=10)
    )
    messages.extend([msg1, msg2, msg3])

    # Realistic filler phrases
    filler_phrases = [
        "Just testing the infinite scroll.",
        "The layout looks much cleaner now.",
        "Did you push the latest changes?",
        "Yep, deployed to production.",
        "Docker containers are up and running.",
        "The pagination logic is tricky but works.",
        "Let's schedule a meeting for Friday.",
        "Can you review my PR?",
        "Don't forget to update the documentation.",
        "Authentication flow is solid.",
        "Frontend state management is handled by Context.",
        "This is a longer message to check how the text wrapping works. It should look nice and readable."
    ]

    # Generate 100 filler messages for Chat 1 (Alice & Bob)
    # We add them ONE BY ONE with increasing timestamps
    current_time = base_time + timedelta(hours=1)

    for i in range(100):
        author = alice if random.choice([True, False]) else bob
        text = random.choice(filler_phrases)

        # Increment time by 5-20 minutes for each message to simulate real chat
        time_jump = random.randint(5, 20)
        current_time += timedelta(minutes=time_jump)

        msg = Message(
            content=text,
            author=author,
            chat=chat1,
            timestamp=current_time
        )
        messages.append(msg)

    # Sorting list just in case, though logic guarantees order
    messages.sort(key=lambda x: x.timestamp)

    db.session.add_all(messages)
    db.session.commit()

    click.echo(f'Added {len(messages)} sample messages with correct timestamps.')
    click.echo('Database seeding completed!')