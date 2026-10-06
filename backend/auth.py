from flask import Blueprint, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy import func
from extensions import db
from models import User
from validation import (
    json_body, clean_text, normalise_email, username_error, email_error, password_error
)

# Create a Blueprint for authentication routes.
bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
          properties:
            username:
              type: string
              example: newuser
            email:
              type: string
              example: new@test.com
            password:
              type: string
              example: secret123
    responses:
      201:
        description: User created successfully
      400:
        description: Missing or invalid fields
      409:
        description: User already exists
    """
    data = json_body()
    username = clean_text(data.get('username'))
    email = normalise_email(data.get('email'))
    password = data.get('password')

    if not username or not email or not isinstance(password, str) or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400

    error = username_error(username) or email_error(email) or password_error(password)
    if error:
        return jsonify({'error': error}), 400

    # Check for existing user to prevent duplicates.
    # We check both email and username as they must be unique in the schema.
    if User.query.filter((func.lower(User.email) == email) | (User.username == username)).first():
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
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to register user")
        return jsonify({'error': 'Database error'}), 500

    return jsonify({'message': 'User created successfully'}), 201


@bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user and return a JWT token.
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: alice@test.com
            password:
              type: string
              example: password
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            access_token:
              type: string
            user:
              type: object
              properties:
                id:
                  type: integer
                username:
                  type: string
                email:
                  type: string
      401:
        description: Invalid credentials
    """
    data = json_body()
    email = normalise_email(data.get('email'))
    password = data.get('password')

    if not email or not isinstance(password, str) or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    # Find user by email
    user = User.query.filter(func.lower(User.email) == email).first()

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