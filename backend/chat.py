from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Chat, Message

bp = Blueprint('chat', __name__, url_prefix='/api/chats')


@bp.route('', methods=['GET'])
@jwt_required()
def get_chats():
    """
    Retrieve all chats for the current user.
    ---
    tags:
      - Chats
    security:
      - Bearer: []
    responses:
      200:
        description: List of active chats
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              partner_id:
                type: integer
              partner_username:
                type: string
    """
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    results = []

    for chat in current_user.chats:
        partner = next((p for p in chat.participants if p.id != current_user_id), None)
        results.append({
            'id': chat.id,
            'partner_id': partner.id if partner else None,
            'partner_username': partner.username if partner else "Unknown",
        })

    return jsonify(results), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_chat():
    """
    Create a new 1-to-1 chat.
    ---
    tags:
      - Chats
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - recipient_id
          properties:
            recipient_id:
              type: integer
              example: 2
    responses:
      201:
        description: Chat created
      400:
        description: Invalid input or self-chat
      404:
        description: Recipient not found
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    recipient_id = data.get('recipient_id')

    if not recipient_id:
        return jsonify({'error': 'Recipient ID is required'}), 400

    if current_user_id == recipient_id:
        return jsonify({'error': 'Cannot chat with yourself'}), 400

    recipient = db.session.get(User, recipient_id)
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404

    current_user = db.session.get(User, current_user_id)

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
    ---
    tags:
      - Messages
    security:
      - Bearer: []
    parameters:
      - in: path
        name: chat_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - content
          properties:
            content:
              type: string
              example: Hello there!
    responses:
      201:
        description: Message sent
      403:
        description: Access denied (not a participant)
      404:
        description: Chat not found
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    content = data.get('content')

    if not content:
        return jsonify({'error': 'Message content is required'}), 400

    chat = db.session.get(Chat, chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

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
    ---
    tags:
      - Messages
    security:
      - Bearer: []
    parameters:
      - in: path
        name: chat_id
        type: integer
        required: true
    responses:
      200:
        description: List of messages
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              content:
                type: string
              timestamp:
                type: string
              author_id:
                type: integer
      403:
        description: Access denied
      404:
        description: Chat not found
    """
    current_user_id = int(get_jwt_identity())

    chat = db.session.get(Chat, chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    is_participant = any(user.id == current_user_id for user in chat.participants)
    if not is_participant:
        return jsonify({'error': 'Access denied'}), 403

    sorted_messages = sorted(chat.messages, key=lambda m: m.timestamp)

    return jsonify([msg.to_dict() for msg in sorted_messages]), 200