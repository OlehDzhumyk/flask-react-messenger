from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from app import db
from models import User

# Create a Blueprint for authentication routes.
# Using a blueprint allows us to organize related routes (auth)
# and prefix them efficiently (e.g., /api/auth).
bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.

    Expected JSON payload:
    - username: str
    - email: str
    - password: str

    Returns:
    - 201: User created successfully.
    - 400: Missing required fields.
    - 409: User already exists.
    """
    data = request.get_json()

    # Validation: Ensure all required fields are present.
    # We explicitly check for password to satisfy the test requirements.
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400

    # Check for existing user to prevent duplicates.
    # We check both email and username as they must be unique in the schema.
    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({'error': 'User already exists'}), 409

    # Security: Never store passwords in plain text.
    # We use scrypt or pbkdf2 (default in werkzeug) to hash the password securely.
    hashed_password = generate_password_hash(password)

    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password
    )

    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        # Rollback in case of database error to keep the session clean.
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    return jsonify({'message': 'User created successfully'}), 201