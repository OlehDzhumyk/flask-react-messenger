from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app import db
from models import User

# Create a Blueprint for authentication routes.
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


@bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user and return a JWT token.

    Expected JSON payload:
    - email: str
    - password: str

    Returns:
    - 200: Login successful, returns access_token.
    - 400: Missing email or password.
    - 401: Invalid credentials.
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validate input presence
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    # Find user by email
    user = User.query.filter_by(email=email).first()

    # Verify user exists and password matches hash
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Generate JWT Token
    # Using user.id as identity is recommended for database lookups in protected routes.
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 200