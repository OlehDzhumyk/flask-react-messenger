# Flask-React Messenger

A secure, self-contained messaging platform built with Python (Flask) and React.
Designed as a microservices-based Single Page Application (SPA).

## 🚀 Features (MVP)
- **User Authentication:** Secure registration & login (JWT).
- **1-to-1 Messaging:** Private conversations.
- **Data Privacy:** Self-hosted database, full control over data.
- **Containerization:** Fully Dockerized environment.

## 🛠 Tech Stack
- **Backend:** Python 3, Flask, SQLAlchemy, PostgreSQL.
- **Frontend:** React, JavaScript (ES6+).
- **Infrastructure:** Docker, Docker Compose.

## ⚡ Quick Start

### Prerequisites
- Docker & Docker Compose installed.

### Run the Application
1. Clone the repository.
2. Create environment files (or use defaults for dev).
3. Start the services:

```bash
docker-compose up -d --build
```


### Development
Backend Tests:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pytest
```

### 📜 License
Educational Project.

