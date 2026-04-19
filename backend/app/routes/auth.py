"""
backend/app/routes/auth.py

POST /api/auth/login  — validates credentials, sets Flask-Login session cookie
POST /api/auth/logout — clears session
GET  /api/auth/me     — returns current user from session (used by AuthContext on refresh)

Register in __init__.py:
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)
"""

from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash

from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _resp(success, data=None, message="", status=200):
    return jsonify({"success": success, "data": data, "message": message}), status


def _user_dict(user):
    return {
        "id":    user.id,
        "name":  getattr(user, "name", None) or getattr(user, "username", None),
        "email": getattr(user, "email", None),
        "role":  getattr(user, "role",  None),
    }


@auth_bp.route("/login", methods=["POST"])
def login():
    body     = request.get_json(silent=True) or {}
    email    = str(body.get("email",    "")).strip().lower()
    password = str(body.get("password", "")).strip()

    if not email or not password:
        return _resp(False, message="Email and password are required.", status=400)

    user = User.query.filter_by(email=email).first()

    # Support password_hash (werkzeug) OR plain password field (dev seeds)
    stored = getattr(user, "password_hash", None) or getattr(user, "password", None)

    if not user or not stored:
        return _resp(False, message="Invalid email or password.", status=401)

    if stored.startswith("pbkdf2:") or stored.startswith("scrypt:"):
        valid = check_password_hash(stored, password)
    else:
        valid = (stored == password)   # plain-text for dev-seeded users

    if not valid:
        return _resp(False, message="Invalid email or password.", status=401)

    login_user(user, remember=True)   # sets the session cookie
    return _resp(True, data=_user_dict(user), message="Login successful.")


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return _resp(True, message="Logged out.")


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return _resp(True, data=_user_dict(current_user))