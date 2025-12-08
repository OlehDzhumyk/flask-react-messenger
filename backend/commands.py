import click
import random
from flask.cli import with_appcontext
from extensions import db
from models import User, Chat, Message
from werkzeug.security import generate_password_hash

@click.command(name='seed_db')
@with_appcontext
def seed_db_command():
    """Populates the database with heavy dummy data for testing."""

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

    # Create 15 extra users for Sidebar scrolling test
    extra_users = []
    for i in range(4, 20):
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
    # Chat 1: Alice & Bob (Main test chat)
    chat1 = Chat()
    chat1.participants.append(alice)
    chat1.participants.append(bob)

    # Chat 2: Alice & Charlie
    chat2 = Chat()
    chat2.participants.append(alice)
    chat2.participants.append(charlie)

    # Create random chats for Alice to fill up the sidebar
    random_chats = []
    for u in extra_users[:10]: # Create chats with first 10 extra users
        c = Chat()
        c.participants.append(alice)
        c.participants.append(u)
        random_chats.append(c)

    db.session.add_all([chat1, chat2] + random_chats)
    db.session.commit()
    click.echo('Created chats.')

    # 4. Create Messages (Heavy Load)
    messages = []

    # Initial greeting messages
    messages.append(Message(content="Hi Bob! How is the project?", author=alice, chat=chat1))
    messages.append(Message(content="Hey Alice. It is going well!", author=bob, chat=chat1))
    messages.append(Message(content="Welcome Charlie!", author=alice, chat=chat2))

    # Generate 100 filler messages for Chat 1 (Alice & Bob)
    filler_phrases = [
        "Just testing the scrolling feature.",
        "Lorem ipsum dolor sit amet.",
        "This is a longer message to check how the text wrapping works in the chat bubble component. It should look nice.",
        "Yep.",
        "Are we done with the API?",
        "React context is tricky sometimes.",
        "Docker is running smoothly.",
        "Cool!",
        "Let's deploy this on Friday.",
        "Did you see the latest update?"
    ]

    for i in range(100):
        # Alternate authors randomly
        author = alice if random.choice([True, False]) else bob
        # Pick a random phrase
        text = f"[{i+1}] " + random.choice(filler_phrases)

        msg = Message(content=text, author=author, chat=chat1)
        messages.append(msg)

    db.session.add_all(messages)
    db.session.commit()

    click.echo(f'Added {len(messages)} sample messages.')
    click.echo('Database seeding completed!')