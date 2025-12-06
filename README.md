# Flask-React Messenger

A secure, self-contained messaging platform designed as a microservices-based Single Page Application (SPA). This project focuses on data privacy, self-hosting capabilities, and a robust RESTful architecture.



[Image of High Level Architecture Diagram]


## Project Overview

This application serves as a viable alternative for users requiring a simple, direct messaging service without sacrificing control over their personal information. It implements a clean separation of concerns between the API backend and the client-side frontend.

### Key Features (MVP)
* **Secure Authentication:** User registration and login flows using JWT (JSON Web Tokens).
* **1-to-1 Messaging:** Private conversation initialization and message history persistence.
* **Message Control:** Users can edit and delete their own messages (CRUD).
* **User Discovery:** Search functionality to find other users on the platform.
* **Data Privacy:** GDPR-compliant account deletion ("Right to be Forgotten").
* **API Documentation:** Automated Swagger UI documentation.
* **Containerization:** Fully orchestrated environment using Docker Compose.

## Technology Stack

* **Backend:** Python 3.11, Flask, SQLAlchemy (ORM), Flask-Migrate, Flask-JWT-Extended.
* **Database:** PostgreSQL 15.
* **Testing:** Pytest (Unit & Integration tests).
* **Infrastructure:** Docker, Docker Compose, GitHub Actions (CI).

## Getting Started

### Prerequisites
* Docker and Docker Compose installed on your machine.
* Git.

### Installation & Execution

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd flask-react-messenger
    ```

2.  **Environment Configuration:**
    Create a `.env` file in the root directory based on the example:
    ```bash
    cp .env.example .env
    ```

3.  **Build and Run:**
    Start the services in detached mode:
    ```bash
    docker-compose up -d --build
    ```

4.  **Database Seeding (Optional):**
    Populate the database with sample users (Alice, Bob, Charlie) and conversations:
    ```bash
    docker-compose exec backend flask seed_db
    ```

The API will be available at `http://localhost:5000`.

## Documentation & API

The project includes auto-generated interactive API documentation via Swagger UI.

* **API Docs:** [http://localhost:5000/apidocs/](http://localhost:5000/apidocs/)
* **Design Document:** See `docs/API_DESIGN.md` for the initial architectural vision.

## Development & Testing

### Running Tests
The project maintains a comprehensive test suite covering authentication, messaging logic, error handling, and security scenarios.

To run tests inside the container:
```bash
docker-compose exec backend pytest