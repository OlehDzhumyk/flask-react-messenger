# Flask-React Messenger

A secure, self-hosted messaging application built with a Python Flask backend and a React (Vite) frontend. Designed with privacy and data control alternatives in mind.


## Features

### Core Functionality
* **Secure Authentication:** JWT-based login and registration with password hashing (SHA-256).
* **1-to-1 Messaging:** Real-time feel using smart polling optimization (incremental fetching).
* **Message History:** Persistent storage with PostgreSQL.
* **Data Control:** Users have full ownership; Edit and Delete functionalities are native.
* **Infinite Scroll:** Bi-directional pagination with scroll position restoration in the UI.
* **GDPR Compliance:** "Right to be forgotten" – Complete account deletion cascades to all associated data while preserving chat integrity for partners.

## Tech Stack

### Backend (API)
* **Framework:** Python 3.11 + Flask (Micro-framework architecture).
* **Database:** PostgreSQL 15 (Relational Data Persistence).
* **ORM:** SQLAlchemy (Models & Relationships).
* **Auth:** Flask-JWT-Extended (Stateless authentication).
* **Documentation:** Flasgger (Swagger UI).

### Frontend (UI)
* **Framework:** React 18 + Vite (SPA).
* **Styling:** Tailwind CSS (Utility-first).
* **State Management:** React Context API (Auth & Users caching).
* **HTTP Client:** Axios with Interceptors.

### Infrastructure
* **Containerization:** Docker & Docker Compose (Orchestration of DB, Backend, Frontend).
* **CI/CD:** GitHub Actions (Automated testing pipeline).

## API Overview

The backend provides a RESTful API structure:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Authenticate & receive JWT |
| `GET` | `/api/users` | Search users by exact email (Security: No Enumeration) |
| `GET` | `/api/chats` | List all active conversations |
| `GET` | `/api/chats/<id>/messages` | Fetch history (supports `limit`, `before_id`, `after_id`) |
| `DELETE`| `/api/profile` | Delete account (GDPR) |

## Database Schema

The application uses a normalized relational schema:
* **Users:** Stores credentials and profile data.
* **Chats:** Manages conversation sessions.
* **Participants:** Association table (Many-to-Many) linking Users to Chats.
* **Messages:** Stores content, timestamps, and foreign keys to User/Chat.

## How to Run

1.  **Prerequisites:** Ensure you have Docker and Docker Compose installed.
2.  **Start the Application:**
    ```bash
    docker-compose up --build
    ```
3.  **Seed the Database (First Run Only):**
    Open a new terminal to populate the DB with test users and messages:
    ```bash
    docker-compose exec backend flask seed_db
    ```
4.  **Access the App:**
    * **Frontend:** `http://localhost:3000`
    * **API Documentation (Swagger):** `http://localhost:5000/apidocs`

## Default Users (from Seed)

Password for all users is: `password`

* `alice@test.com`
* `bob@test.com`
* `charlie@test.com`