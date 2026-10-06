FROM python:3.11-slim

WORKDIR /app

# Don't write .pyc files; flush logs straight to `docker logs`
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy requirements first so the dependency layer is cached between code changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Bring the database schema up to date, then start the development server
CMD ["sh", "-c", "flask db upgrade && flask run --host=0.0.0.0"]
