# **Flask Messenger API (Backend)**

This directory contains the server-side logic for the Flask-React Messenger application. It provides a RESTful API built with Python and Flask, managing authentication, real-time messaging simulation (smart polling), and database persistence.

## **Technology Stack**

* **Core Framework:** Python 3.11, Flask
* **Database:** PostgreSQL 15 (Production), SQLite (Dev/Test fallback)
* **ORM:** SQLAlchemy (Data modeling and queries)
* **Authentication:** Flask-JWT-Extended (Stateless token-based auth)
* **Documentation:** Flasgger (Auto-generated Swagger UI)
* **Testing:** Pytest

## **Project Structure**

```
backend/  
├── app.py              \# Application factory and configuration  
├── models.py           \# Database models (User, Chat, Message)  
├── extensions.py       \# Flask extensions initialization (DB, JWT, Migrate)  
├── commands.py         \# Custom CLI commands (e.g., seed\_db)  
├── chat.py             \# Blueprints for Chat and Message logic  
├── auth.py             \# Authentication routes  
├── users.py            \# User management and search  
├── requirements.txt    \# Python dependencies  
└── tests/              \# Comprehensive test suite
```

## **Getting Started (Docker)**

The easiest way to run the backend is via the root Docker Compose setup. However, you can interact with the backend container directly for maintenance.

### **Common Commands**

**Seed the Database** Populates the DB with chronological dummy data for testing.

`docker-compose exec backend flask seed\_db`

**Run Database Migrations**

`docker-compose exec backend flask db upgrade`

**Access Shell**

`docker-compose exec backend flask shell`

## **Testing**

Testing is a critical part of this project. We use `pytest` for unit and integration testing to ensure API stability and security compliance.

### **Running Tests**

To execute the full test suite inside the container:

`docker-compose exec backend pytest \-v`

### **Test Coverage**

The tests cover the following areas:

* **Authentication:** Registration validation, Login flows, JWT issuance.
* **User Features:** Secure search (exact email match), Profile updates, GDPR deletion.
* **Messaging:** Chat creation logic (preventing duplicates), Message CRUD operations.
* **Pagination:** Verifying limit and `before_id` logic for infinite scrolling.
* **Security:** Ensuring users cannot edit/delete messages they don't own.
