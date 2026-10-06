# Flask-React Messenger

[![CI Pipeline](https://github.com/OlehDzhumyk/flask-react-messenger/actions/workflows/ci.yml/badge.svg)](https://github.com/OlehDzhumyk/flask-react-messenger/actions/workflows/ci.yml)

A self-hosted one-to-one messenger: a REST API in Flask with PostgreSQL, and a single-page React client.
Users can register, start chats by email, send, edit and delete messages, scroll back through history,
and delete their account without breaking the conversation for the other person.

![Chat view](docs/screenshots/chat.png)

## Features

- **Accounts:** registration and login with JWT. Passwords are stored as salted Werkzeug (scrypt) hashes,
  and emails are matched case-insensitively.
- **Chats:** start a conversation by entering someone's exact email. The chat list shows the last message,
  sorted by recent activity, and refreshes in the background.
- **Messages:** send, edit and delete your own messages. Only chat participants can read a chat, and only
  the author can change a message (`403` otherwise).
- **History:** loads the latest 50 messages, then older pages as you scroll up, keeping the scroll position.
  Messages are grouped by day.
- **Near real-time updates:** every 3 seconds the client asks for messages newer than the last one it has.
- **Account deletion:** removes the user; their messages stay in the partner's history under "Deleted Account",
  and any token they still hold stops working.
- **API docs:** interactive Swagger UI generated from the endpoint docstrings.

## Tech stack

| Layer | Technologies |
| :--- | :--- |
| Backend | Python 3.11, Flask (app factory + blueprints), Flask-SQLAlchemy, Flask-Migrate (Alembic), Flask-JWT-Extended, Flasgger |
| Database | PostgreSQL 15 (SQLite in-memory for tests) |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Formik + Yup |
| Testing | pytest, Vitest, React Testing Library |
| Tooling | Docker Compose, ESLint, GitHub Actions |

## Design decisions

**Polling instead of WebSockets.** New messages are fetched with `GET /api/chats/<id>/messages?after_id=<last id>`,
so each poll returns only the delta (usually nothing). This keeps the API stateless and easy to deploy and test.
The trade-off is up to 3 s of latency and some idle requests; WebSockets are the next step (see below).

**Cursor-based pagination.** History is paged with message ids (`before_id`, `after_id`) rather than page
numbers. Offsets shift when new messages arrive, but cursors don't, so scrolling never shows a message twice
or skips one. Page size is capped at 100.

**No user enumeration.** `GET /api/users` only matches a complete email address. You can't list users or search
by partial name, and login returns the same error for a wrong password and an unknown email.

**Deleting an account keeps your partner's history.** The author foreign key on messages is nullable
(`ON DELETE SET NULL`), so the deleted user's identity is removed but the conversation still makes sense to
the other participant.

**Timestamps are UTC.** They are stored in UTC and returned with an explicit offset, and the browser converts
them to local time.

## Running locally

Requirements: Docker with Docker Compose.

```bash
git clone https://github.com/OlehDzhumyk/flask-react-messenger.git
cd flask-react-messenger
cp backend/.env.example .env        # Compose reads variables from the project root
docker compose up --build
```

The backend applies database migrations on start-up. To load demo users and conversations, run this in a
second terminal (it replaces any existing data):

```bash
docker compose exec backend flask seed_db
```

| | URL |
| :--- | :--- |
| App | http://localhost:3000 |
| Swagger UI | http://localhost:5000/apidocs |

Log in as `alice@test.com` with password `password`. Every demo user has the same password, including
`bob@test.com` and `charlie@test.com`.

> **macOS:** port 5000 is taken by AirPlay Receiver. If the backend fails with "address already in use",
> turn it off in *System Settings → General → AirDrop & Handoff*.

The frontend calls `http://localhost:5000/api` by default; set `VITE_API_URL` to use a different backend.

## Tests

| | Tests | What they cover |
| :--- | :--- | :--- |
| Backend (pytest) | 83, 93% coverage | auth and validation, access control, chat list ordering, pagination and polling, editing, account deletion, seed command |
| Frontend (Vitest) | 25 | date formatting, API client, message input/editing, chat list previews and filtering |

```bash
# with the stack running
docker compose exec backend pytest
docker compose exec frontend npm test
```

Backend tests use an in-memory SQLite database, so they don't need Postgres. GitHub Actions runs both suites,
lints and builds the frontend on every push and pull request to `main` and `develop`.

## API

All endpoints except register, login and health need an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/api/users?q=<email>` | Find a user by exact email |
| `GET` `PUT` `DELETE` | `/api/profile` | View, update or delete your account |
| `GET` | `/api/chats` | Your chats with their last message, most recent first |
| `POST` | `/api/chats` | Start a chat (or get the existing one) |
| `GET` | `/api/chats/<id>/messages` | History; supports `limit`, `before_id`, `after_id` |
| `POST` | `/api/chats/<id>/messages` | Send a message |
| `PUT` `DELETE` | `/api/messages/<id>` | Edit or delete your message |
| `GET` | `/api/health` | Health check used by Docker Compose |

Request and response details are in Swagger UI and [docs/API_DESIGN.md](docs/API_DESIGN.md).

## Project structure

```
backend/
  app.py            app factory, config, JWT user lookup
  auth.py           register / login
  chat.py           chats and messages
  users.py          user search and profile
  models.py         User, Chat, Message (+ participants table)
  validation.py     request body helpers and field rules
  commands.py       `flask seed_db`
  migrations/       Alembic migrations
  tests/
frontend/src/
  pages/            Login, Register, Dashboard
  components/       chat window, sidebar, modals
  context/          auth state and user cache
  services/         Axios API client
  utils/            date formatting and chat helpers
```

## Limitations and next steps

- Replace polling with WebSockets (Flask-SocketIO) for instant delivery and typing indicators.
  Polling also only picks up new messages, so the other person's edits and deletes appear after reopening the chat.
- The token is a single 12-hour access token kept in `localStorage`; refresh tokens in an HttpOnly cookie
  would be safer.
- Both containers run development servers. A production setup would use Gunicorn and a static build behind Nginx.
- One-to-one chats only, although the data model (a participants table) already allows group chats.
