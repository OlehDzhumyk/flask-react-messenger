from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User

bp = Blueprint('users', __name__, url_prefix='/api')


@bp.route('/users', methods=['GET'])
@jwt_required()
def search_users():
    """
    Search for users by username.
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
        description: Partial username to search for
    responses:
      200:
        description: List of matching users
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
    current_user_id = int(get_jwt_identity())
    query = request.args.get('q', '').strip()

    if not query:
        return jsonify([]), 200

    users = User.query.filter(
        User.username.ilike(f'%{query}%'),
        User.id != current_user_id
    ).limit(20).all()

    results = [{'id': u.id, 'username': u.username, 'email': u.email} for u in users]
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
      404:
        description: User not found
    """
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        db.session.delete(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
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
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email
    }), 200