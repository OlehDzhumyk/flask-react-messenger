# API reference

All endpoints are under `/api` and exchange JSON. Interactive docs are served at `/apidocs` when the backend is running.

## Authentication

`POST /auth/login` returns a JWT. Send it on every other request:

```
Authorization: Bearer <access_token>
```

Tokens last 12 hours by default (`JWT_EXPIRES_HOURS`). A missing or expired token gets `401`, a malformed one
`422`. A token whose account has been deleted also gets `401`.

## Errors

Errors have the form `{"error": "<message>"}` and use these status codes:

| Status | Meaning |
| :--- | :--- |
| `400` | Missing or invalid input (including a body that isn't a JSON object) |
| `401` | Not logged in, or wrong email/password on login |
| `403` | Logged in, but not a participant of the chat or not the author of the message |
| `404` | Chat, message or recipient doesn't exist |
| `409` | Username or email already taken |

## Auth

### `POST /auth/register`

```json
{ "username": "alice", "email": "alice@test.com", "password": "secret123" }
```

The username must be 3–80 characters and the password at least 6. The email must be valid; it is stored
in lower case. Returns `201`, or `409` if the username or email is taken.

### `POST /auth/login`

```json
{ "email": "alice@test.com", "password": "secret123" }
```

```json
{
  "message": "Login successful",
  "access_token": "eyJ...",
  "user": { "id": 1, "username": "alice", "email": "alice@test.com" }
}
```

## Users and profile

| Method | Endpoint | Notes |
| :--- | :--- | :--- |
| `GET` | `/users?q=<email>` | Returns `[user]` for an exact (case-insensitive) email match, otherwise `[]`. Never returns yourself. |
| `GET` | `/profile` | `{ id, username, email }` |
| `PUT` | `/profile` | Body with `username` and/or `email`; omitted fields are unchanged. `409` if taken. |
| `DELETE` | `/profile` | Deletes the account. Messages stay in chats with `author_id: null`. |

## Chats

A chat as seen by the current user:

```json
{
  "id": 1,
  "chat_id": 1,
  "partner_id": 2,
  "partner_username": "bob",
  "last_message": { "id": 117, "content": "See you!", "author_id": 2, "chat_id": 1,
                    "timestamp": "2026-10-06T16:28:05.915876+00:00" }
}
```

`partner_id` and `partner_username` are `null` if the partner deleted their account. `chat_id` duplicates
`id` for older clients.

| Method | Endpoint | Notes |
| :--- | :--- | :--- |
| `GET` | `/chats` | All your chats, most recently active first. `last_message` is `null` for a chat with no messages. |
| `POST` | `/chats` | Body `{ "recipient_id": 2 }`. Returns the chat (without `last_message`): `201` if created, `200` if it already existed. |

## Messages

A message:

```json
{ "id": 42, "content": "Hello", "author_id": 1, "chat_id": 1, "timestamp": "2026-10-06T16:28:05+00:00" }
```

### `GET /chats/<id>/messages`

Message ids increase over time and are used as cursors:

| Query | Returns |
| :--- | :--- |
| *(none)* | The latest `limit` messages |
| `before_id=<id>` | The `limit` messages just before `id`, to scroll back through history |
| `after_id=<id>` | Up to `limit` messages after `id`, for polling. `after_id=0` starts from the beginning. |

`limit` defaults to 50 and is clamped to 1–100. Results are always oldest first.

| Method | Endpoint | Notes |
| :--- | :--- | :--- |
| `POST` | `/chats/<id>/messages` | Body `{ "content": "..." }`; surrounding whitespace is trimmed and empty content is rejected. Returns `201` with the message. |
| `PUT` | `/messages/<id>` | Body `{ "content": "..." }`. Author only. |
| `DELETE` | `/messages/<id>` | Author only. |

## Real-time updates

The client polls `after_id=<last id>` every 3 seconds for the open chat and refreshes the chat list every
10 seconds. WebSockets would replace both.
