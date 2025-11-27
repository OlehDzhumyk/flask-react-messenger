# API Design Specification

This document outlines the RESTful API endpoints and the WebSocket events strategy.
All REST endpoints are prefixed with `/api`.

## 1. Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Create a new user account. Returns 201 Created. | No |
| `POST` | `/auth/login` | Authenticate user. Returns JWT token. | No |

## 2. Users & Profile

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | List all users (for discovery). | Yes (JWT) |
| `GET` | `/profile` | Get current user's details. | Yes (JWT) |
| `PUT` | `/profile` | Update profile info. | Yes (JWT) |
| `DELETE` | `/profile` | Delete account and all data (GDPR). | Yes (JWT) |

## 3. Chats

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/chats` | Get list of active conversations. | Yes (JWT) |
| `POST` | `/chats` | Create a new chat with another user. | Yes (JWT) |

## 4. Messages

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/chats/<id>/messages` | Get message history for a chat. | Yes (JWT) |
| `POST` | `/chats/<id>/messages` | Send a new message. | Yes (JWT) |
| `PUT` | `/messages/<id>` | Edit a message. | Yes (JWT) |
| `DELETE` | `/messages/<id>` | Delete a message. | Yes (JWT) |

---

## 5. WebSocket Strategy (Future Implementation)

The system uses a "Hybrid" approach.
- **REST** is used for persistence and history.
- **Socket.IO** is used for real-time events.

### Events
- `connect`: Client connects with JWT.
- `new_message`: Server broadcasts this event to participants when a POST is made to `/messages`.
- `typing`: Client emits when typing; Server broadcasts to chat participants.