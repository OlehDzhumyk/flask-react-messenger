import click
from flask.cli import with_appcontext
from extensions import db
from models import User, Chat, Message
from werkzeug.security import generate_password_hash


@click.command(name='seed_db')
@with_appcontext
def seed_db_command():
    """Populates the database with initial dummy data."""

    # 1. Clear existing data (Optional, be careful in prod!)
    db.drop_all()
    db.create_all()
    click.echo('Initialized the database.')

    # 2. Create Users
    password = generate_password_hash('password')

    alice = User(username='Alice', email='alice@test.com', password_hash=password)
    bob = User(username='Bob', email='bob@test.com', password_hash=password)
    charlie = User(username='Charlie', email='charlie@test.com', password_hash=password)

    db.session.add_all([alice, bob, charlie])
    db.session.commit()
    click.echo('Created users: Alice, Bob, Charlie (password: password)')

    # 3. Create Chats
    # Chat 1: Alice & Bob
    chat1 = Chat()
    chat1.participants.append(alice)
    chat1.participants.append(bob)

    # Chat 2: Alice & Charlie
    chat2 = Chat()
    chat2.participants.append(alice)
    chat2.participants.append(charlie)

    db.session.add_all([chat1, chat2])
    db.session.commit()
    click.echo('Created chats.')

    # 4. Create Messages
    msg1 = Message(content="Hi Bob! How is the project?", author=alice, chat=chat1)
    msg2 = Message(content="Hey Alice. It is going well!", author=bob, chat=chat1)
    msg3 = Message(content="Welcome Charlie!", author=alice, chat=chat2)

    db.session.add_all([msg1, msg2, msg3])
    db.session.commit()
    click.echo('Added sample messages.')
    click.echo('Database seeding completed!')