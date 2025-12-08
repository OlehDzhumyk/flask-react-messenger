from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Chat, Message

# Blueprint 1: Handles Chat operations and sending messages to a chat.
# Base URL: /api/chats
chat_bp = Blueprint('chat', __name__, url_prefix='/api/chats')

# Blueprint 2: Handles operations on specific messages (Edit/Delete).
# Base URL: /api/messages
message_bp = Blueprint('message', __name__, url_prefix='/api/messages')


@chat_bp.route('', methods=['GET'])
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

    # Iterate over the user's chats
    for chat in current_user.chats:
        # MVP Logic for 1-on-1: Find the participant who is NOT me.
        partner = next((p for p in chat.participants if p.id != current_user_id), None)
        results.append({
            'id': chat.id,
            'partner_id': partner.id if partner else None,
            'partner_username': partner.username if partner else "Unknown",
        })

    return jsonify(results), 200


@chat_bp.route('', methods=['POST'])
@jwt_required()
def create_chat():
    """
    Create a new 1-to-1 chat or return existing one.
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
      200:
        description: Chat already exists (returns existing ID)
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

    # --- LOGIC TO PREVENT DUPLICATES ---
    existing_chat = None

    for chat in current_user.chats:
        if len(chat.participants) == 2:
            participant_ids = [p.id for p in chat.participants]
            if recipient.id in participant_ids:
                existing_chat = chat
                break

    if existing_chat:
        return jsonify({
            'message': 'Chat already exists',
            'chat_id': existing_chat.id
        }), 200
    # -----------------------------------

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


@chat_bp.route('/<int:chat_id>/messages', methods=['POST'])
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


@chat_bp.route('/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(chat_id):
    """
    Retrieve message history with pagination.
    Params:
      - limit: int (default 50)
      - after_id: int (optional) - For polling (newer than X)
      - before_id: int (optional) - For pagination (older than X)
    ---
    tags:
      - Messages
    security:
      - Bearer: []
    """
    current_user_id = int(get_jwt_identity())

    # Get query params
    limit = request.args.get('limit', 50, type=int)
    after_id = request.args.get('after_id', type=int)
    before_id = request.args.get('before_id', type=int) # 👈 ADDED BACK

    chat = db.session.get(Chat, chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    is_participant = any(user.id == current_user_id for user in chat.participants)
    if not is_participant:
        return jsonify({'error': 'Access denied'}), 403

    # Build Query
    query = Message.query.filter_by(chat_id=chat_id)

    if after_id:
        # Polling: Get NEWER messages
        query = query.filter(Message.id > after_id).order_by(Message.timestamp.asc())
    elif before_id:
        # Pagination: Get OLDER messages (History)
        # 👈 ADDED BACK: Logic to fetch messages OLDER than before_id
        query = query.filter(Message.id < before_id).order_by(Message.timestamp.desc()).limit(limit)
    else:
        # Initial Load: Get latest messages
        query = query.order_by(Message.timestamp.desc()).limit(limit)

    messages = query.all()

    # If we fetched by DESC (Initial load OR Pagination), reverse to show chronological order
    if not after_id:
        messages = messages[::-1]

    return jsonify([msg.to_dict() for msg in messages]), 200


# --- Message Control Routes (Edit/Delete) ---

@message_bp.route('/<int:message_id>', methods=['PUT'])
@jwt_required()
def edit_message(message_id):
    """
    Edit a specific message.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    new_content = data.get('content')

    if not new_content:
        return jsonify({'error': 'Content is required'}), 400

    message = db.session.get(Message, message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404

    if message.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403

    message.content = new_content

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update message'}), 500

    return jsonify(message.to_dict()), 200


@message_bp.route('/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """
    Delete a specific message.
    """
    current_user_id = int(get_jwt_identity())

    message = db.session.get(Message, message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404

    if message.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403

    try:
        db.session.delete(message)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete message'}), 500

    return jsonify({'message': 'Message deleted'}), 200