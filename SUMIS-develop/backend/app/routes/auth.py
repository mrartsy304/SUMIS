from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from app.models import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": f"No account found for {email}. Run the backend once to seed users."}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Wrong password"}), 401

    login_user(user, remember=True)
    return jsonify({
        "user": {
            "id":    user.id,
            "name":  user.name,
            "email": user.email,
            "role":  user.role,
        }
    }), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    if not current_user.is_authenticated:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({
        "id":    current_user.id,
        "name":  current_user.name,
        "email": current_user.email,
        "role":  current_user.role,
    }), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route("/seed-now", methods=["POST"])
def seed_now():
    """
    Emergency seed endpoint — call this if users table is empty.
    POST /api/auth/seed-now
    Returns list of created users.
    """
    SEED_USERS = [
        {"name": "Abdul Qadir", "email": "student@sumis.edu", "password": "pass123", "role": "student"},
        {"name": "Dr. Imran",   "email": "faculty@sumis.edu", "password": "pass123", "role": "faculty"},
        {"name": "Staff User",  "email": "staff@sumis.edu",   "password": "pass123", "role": "staff"},
        {"name": "Admin User",  "email": "admin@sumis.edu",   "password": "pass123", "role": "admin"},
        {"name": "Event Coord", "email": "events@sumis.edu",  "password": "pass123", "role": "event_coordinator"},
    ]
    created = []
    for u in SEED_USERS:
        existing = User.query.filter_by(email=u["email"]).first()
        if not existing:
            new_user = User(
                name=u["name"],
                email=u["email"],
                password_hash=generate_password_hash(u["password"]),
                role=u["role"],
            )
            db.session.add(new_user)
            created.append(u["email"])
    db.session.commit()
    all_users = User.query.all()
    return jsonify({
        "seeded": created,
        "total_users": len(all_users),
        "users": [{"id": u.id, "email": u.email, "role": u.role} for u in all_users],
    }), 200


@auth_bp.route("/check-users", methods=["GET"])
def check_users():
    """Debug: see all users in DB without exposing passwords."""
    users = User.query.all()
    return jsonify({
        "count": len(users),
        "users": [{"id": u.id, "email": u.email, "role": u.role} for u in users],
    }), 200