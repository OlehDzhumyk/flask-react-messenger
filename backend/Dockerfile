# Use an official Python runtime as a parent image.
# We use 'slim' variant to keep the image size small while having necessary tools.
FROM python:3.11-slim

# Set the working directory in the container to /app.
# This keeps our application code isolated from system files.
WORKDIR /app

# Set environment variables:
# 1. PYTHONDONTWRITEBYTECODE: Prevents Python from writing .pyc files to disc (useless in containers).
# 2. PYTHONUNBUFFERED: Ensures logs are flushed directly to stdout (crucial for Docker logs debugging).
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies.
# 'netcat-openbsd' is often used to wait for the DB to be ready before starting the app.
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Install python dependencies.
# We copy requirements first to leverage Docker layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code.
COPY . .

# Expose port 5000 for Flask.
EXPOSE 5000

# Run the application.
# We bind to 0.0.0.0 so the service is accessible outside the container.
CMD ["flask", "run", "--host=0.0.0.0"]