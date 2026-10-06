from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_current_user
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from extensions import db
from models import User
from validation import json_body, clean_text, normalise_email, username_error, email_error

bp = Blueprint('users', __name__, url_prefix='/api')


@bp.route('/users', methods=['GET'])
@jwt_required()
def search_users():
    """
    Search for a user by their exact email address (case-insensitive).
    Partial matches are not supported, so the endpoint can't be used to enumerate users.
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: query
        name: q
        type: string
        required: true
        description: Exact email address to search for
    responses:
      200:
        description: List containing the matching user (or empty)
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              username:
                type: string
              email:
                type: string
    """
    query = request.args.get('q', '').strip().lower()

    if not query or '@' not in query:
        return jsonify([]), 200

    user = User.query.filter(
        func.lower(User.email) == query,
        User.id != get_current_user().id
    ).first()

    results = []
    if user:
        results.append({'id': user.id, 'username': user.username, 'email': user.email})

    return jsonify(results), 200


@bp.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    """
    Delete the current user's account (GDPR).
    ---
    tags:
      - Users
    security:
      - Bearer: []
    responses:
      200:
        description: Account deleted successfully
    """
    user = get_current_user()

    try:
        db.session.delete(user)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to delete user %s", user.id)
        return jsonify({'error': 'Failed to delete account'}), 500

    return jsonify({'message': 'Account deleted successfully'}), 200


@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get current user details.
    ---
    tags:
      - Users
    security:
      - Bearer: []
    responses:
      200:
        description: User profile info
        schema:
          type: object
          properties:
            id:
              type: integer
            username:
              type: string
            email:
              type: string
    """
    user = get_current_user()

    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email
    }), 200


@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update the current user's profile information.
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
            email:
              type: string
    responses:
      200:
        description: Profile updated successfully
      400:
        description: Invalid username or email
      409:
        description: Username or email already taken
    """
    user = get_current_user()

    data = json_body()
    new_username = clean_text(data.get('username'))
    new_email = normalise_email(data.get('email'))

    error = (new_username and username_error(new_username)) or (new_email and email_error(new_email))
    if error:
        return jsonify({'error': error}), 400

    if new_username:
        user.username = new_username
    if new_email:
        user.email = new_email

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Username or email already exists'}), 409
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to update profile for user %s", user.id)
        return jsonify({'error': 'Failed to update profile'}), 500

    return jsonify({
        'message': 'Profile updated successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 200