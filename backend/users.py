from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import User

# Blueprint for user-related operations
bp = Blueprint('users', __name__, url_prefix='/api')


@bp.route('/users', methods=['GET'])
@jwt_required()
def search_users():
    """
    Search for users by username.
    Query Param: ?q=<search_term>
    """
    current_user_id = int(get_jwt_identity())
    query = request.args.get('q', '').strip()

    if not query:
        return jsonify([]), 200

    # Filter users: match username, exclude current user
    # ilike is case-insensitive search in PostgreSQL (use like for SQLite fallback if needed)
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
    Delete the current user's account and all associated data.
    """
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        # SQLAlchemy cascade rules (defined in models) should handle message cleanup
        db.session.delete(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete account'}), 500

    return jsonify({'message': 'Account deleted successfully'}), 200


# Endpoint to get current profile info (Bonus)
@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email
    }), 200