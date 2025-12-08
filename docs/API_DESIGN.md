# API Design Specification

This document outlines the RESTful API endpoints and the architecture strategy.
All REST endpoints are prefixed with `/api`.

## 1. Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Create a new user account. Returns 201 Created. | No |
| `POST` | `/auth/login` | Authenticate user. Returns JWT token. | No |

## 2. Users & Profile

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Search users by **exact email** (param: `?q=email`). | Yes (JWT) |
| `GET` | `/profile` | Get current user's details. | Yes (JWT) |
| `PUT` | `/profile` | Update profile info. | Yes (JWT) |
| `DELETE` | `/profile` | Delete account and all data (GDPR). | Yes (JWT) |

## 3. Chats

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/chats` | Get list of active conversations. | Yes (JWT) |
| `POST` | `/chats` | Create a new chat or return existing one. | Yes (JWT) |

## 4. Messages

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/chats/<id>/messages` | Get history. Supports `limit`, `before_id` (pagination), `after_id` (polling). | Yes (JWT) |
| `POST` | `/chats/<id>/messages` | Send a new message. | Yes (JWT) |
| `PUT` | `/messages/<id>` | Edit a message. | Yes (JWT) |
| `DELETE` | `/messages/<id>` | Delete a message. | Yes (JWT) |

---

## 5. Real-Time Strategy

The system currently uses **Smart Polling** (incremental fetching via `after_id`) to simulate real-time updates while maintaining stateless REST architecture.

*Future Implementation:* Migration to WebSocket (Socket.IO) for `new_message` and `typing` events.