from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import User, Chat, Message

bp = Blueprint('chat', __name__, url_prefix='/api/chats')


@bp.route('', methods=['GET'])
@jwt_required()
def get_chats():
    """
    Retrieve all chats for the current user.
    Returns a list of chats with the partner's details (for 1-to-1).
    """
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    results = []

    # Iterate over the user's chats (accessed via the relationship defined in models)
    for chat in current_user.chats:
        # MVP Logic for 1-on-1: Find the participant who is NOT me.
        # If group chats are added later, this logic needs to update.
        partner = next((p for p in chat.participants if p.id != current_user_id), None)

        results.append({
            'id': chat.id,
            'partner_id': partner.id if partner else None,
            'partner_username': partner.username if partner else "Unknown",
            # Optional: Add last message preview here if we had time
        })

    return jsonify(results), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_chat():
    """
    Create a new 1-to-1 chat between the current user and a recipient.

    Expected JSON: { "recipient_id": int }
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    recipient_id = data.get('recipient_id')

    if not recipient_id:
        return jsonify({'error': 'Recipient ID is required'}), 400

    if current_user_id == recipient_id:
        return jsonify({'error': 'Cannot chat with yourself'}), 400

    # Check if recipient exists
    recipient = db.session.get(User, recipient_id)
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404

    current_user = db.session.get(User, current_user_id)

    # Logic to check if chat already exists could go here,
    # but for MVP we simply create a new chat room.

    new_chat = Chat()
    new_chat.participants.append(current_user)
    new_chat.participants.append(recipient)

    try:
        db.session.add(new_chat)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to create chat'}), 500

    return jsonify({'message': 'Chat created', 'chat_id': new_chat.id}), 201


@bp.route('/<int:chat_id>/messages', methods=['POST'])
@jwt_required()
def send_message(chat_id):
    """
    Send a message to a specific chat.

    Expected JSON: { "content": str }
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    content = data.get('content')

    if not content:
        return jsonify({'error': 'Message content is required'}), 400

    # Verify chat exists
    chat = db.session.get(Chat, chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    # Verify user is a participant in this chat
    # This is a critical security check (Authorization)
    is_participant = any(user.id == current_user_id for user in chat.participants)
    if not is_participant:
        return jsonify({'error': 'Access denied'}), 403

    message = Message(
        content=content,
        user_id=current_user_id,
        chat_id=chat_id
    )

    try:
        db.session.add(message)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to send message'}), 500

    return jsonify(message.to_dict()), 201


@bp.route('/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(chat_id):
    """
    Retrieve message history for a specific chat.
    """
    current_user_id = int(get_jwt_identity())

    chat = db.session.get(Chat, chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    # Security check
    is_participant = any(user.id == current_user_id for user in chat.participants)
    if not is_participant:
        return jsonify({'error': 'Access denied'}), 403

    # Return messages ordered by timestamp
    # Assuming the relationship in models.py is loaded or we access via chat.messages
    # We sort them to be sure, though DB usually inserts sequentially.
    sorted_messages = sorted(chat.messages, key=lambda m: m.timestamp)

    return jsonify([msg.to_dict() for msg in sorted_messages]), 200


