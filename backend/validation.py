"""Small helpers for reading and validating JSON request bodies."""
import re

from flask import request

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

USERNAME_MIN, USERNAME_MAX = 3, 80   # matches User.username column
EMAIL_MAX = 120                      # matches User.email column
PASSWORD_MIN = 6


def json_body() -> dict:
    """Return the request's JSON object, or an empty dict if the body is missing or not an object."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def clean_text(value):
    """Strip a string value; anything that isn't a string becomes None."""
    return value.strip() if isinstance(value, str) else None


def normalise_email(value):
    email = clean_text(value)
    return email.lower() if email else email


def username_error(username):
    if not USERNAME_MIN <= len(username) <= USERNAME_MAX:
        return f'Username must be {USERNAME_MIN}-{USERNAME_MAX} characters'
    return None


def email_error(email):
    if len(email) > EMAIL_MAX or not EMAIL_RE.match(email):
        return 'Invalid email address'
    return None


def password_error(password):
    if len(password) < PASSWORD_MIN:
        return f'Password must be at least {PASSWORD_MIN} characters'
    return None
