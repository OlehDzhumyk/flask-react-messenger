from datetime import timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_current_user
from extensions import db
from models import User, Chat, Message
from validation import json_body, clean_text

DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 100

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
    Retrieve all chats for the current user, most recently active first.
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
              last_message:
                type: object
                description: Latest message in the chat, or null if it has none
    """
    me = get_current_user()
    summaries = []
    for chat in me.chats:
        partner = next((p for p in chat.participants if p.id != me.id), None)
        last_message = (Message.query.filter_by(chat_id=chat.id)
                        .order_by(Message.id.desc()).first())
        summary = _chat_summary(chat, partner)
        summary['last_message'] = last_message.to_dict() if last_message else None
        last_active = last_message.timestamp if last_message else chat.created_at
        summaries.append((_as_utc(last_active), summary))

    summaries.sort(key=lambda item: item[0], reverse=True)
    return jsonify([summary for _, summary in summaries]), 200


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
    me = get_current_user()
    recipient_id = json_body().get('recipient_id')

    if type(recipient_id) is not int:
        return jsonify({'error': 'Recipient ID is required'}), 400

    if me.id == recipient_id:
        return jsonify({'error': 'Cannot chat with yourself'}), 400

    recipient = db.session.get(User, recipient_id)
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404

    # Return the existing 1-to-1 chat instead of creating a duplicate
    existing_chat = next(
        (chat for chat in me.chats if len(chat.participants) == 2 and recipient in chat.participants),
        None,
    )
    if existing_chat:
        return jsonify({**_chat_summary(existing_chat, recipient), 'message': 'Chat already exists'}), 200

    new_chat = Chat(participants=[me, recipient])

    try:
        db.session.add(new_chat)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to create chat'}), 500

    return jsonify({**_chat_summary(new_chat, recipient), 'message': 'Chat created'}), 201


def _chat_summary(chat, partner):
    """Chat as seen by one participant. POST /api/chats returns the same shape as GET."""
    return {
        'id': chat.id,
        'chat_id': chat.id,
        'partner_id': partner.id if partner else None,
        'partner_username': partner.username if partner else None,
    }


def _as_utc(dt):
    """Timestamps are stored in UTC; some drivers return them without tzinfo."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _participant_chat_or_error(chat_id):
    """Return (chat, None) if the current user is in the chat, else (None, error response)."""
    chat = db.session.get(Chat, chat_id)
    if not chat:
        return None, (jsonify({'error': 'Chat not found'}), 404)
    if get_current_user() not in chat.participants:
        return None, (jsonify({'error': 'Access denied'}), 403)
    return chat, None


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
    content = clean_text(json_body().get('content'))
    if not content:
        return jsonify({'error': 'Message content is required'}), 400

    chat, error = _participant_chat_or_error(chat_id)
    if error:
        return error

    message = Message(content=content, user_id=get_current_user().id, chat_id=chat.id)

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
    limit = request.args.get('limit', DEFAULT_PAGE_SIZE, type=int)
    limit = max(1, min(limit, MAX_PAGE_SIZE))
    after_id = request.args.get('after_id', type=int)
    before_id = request.args.get('before_id', type=int)

    chat, error = _participant_chat_or_error(chat_id)
    if error:
        return error

    # Message ids increase over time, so they double as stable pagination cursors.
    query = Message.query.filter_by(chat_id=chat.id)
    if after_id is not None:
        # Polling: the oldest messages newer than the client's last one
        messages = query.filter(Message.id > after_id).order_by(Message.id.asc()).limit(limit).all()
    else:
        # Initial load or scrolling back: the newest page before the cursor, oldest first
        if before_id is not None:
            query = query.filter(Message.id < before_id)
        messages = query.order_by(Message.id.desc()).limit(limit).all()[::-1]

    return jsonify([msg.to_dict() for msg in messages]), 200



@message_bp.route('/<int:message_id>', methods=['PUT'])
@jwt_required()
def edit_message(message_id):
    """
    Edit a specific message.
    """
    new_content = clean_text(json_body().get('content'))
    if not new_content:
        return jsonify({'error': 'Content is required'}), 400

    message = db.session.get(Message, message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404

    if message.user_id != get_current_user().id:
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
    message = db.session.get(Message, message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404

    if message.user_id != get_current_user().id:
        return jsonify({'error': 'Access denied'}), 403

    try:
        db.session.delete(message)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete message'}), 500

    return jsonify({'message': 'Message deleted'}), 200