from werkzeug.security import generate_password_hash
from app.models import db
from app.models.user import User

SEED_USERS = [
    {"name": "Abdul Qadir", "email": "student@sumis.edu", "password": "pass123", "role": "student"},
    {"name": "Dr. Imran",   "email": "faculty@sumis.edu", "password": "pass123", "role": "faculty"},
    {"name": "Staff User",  "email": "staff@sumis.edu",   "password": "pass123", "role": "staff"},
    {"name": "Admin User",  "email": "admin@sumis.edu",   "password": "pass123", "role": "admin"},
    {"name": "Event Coord", "email": "events@sumis.edu",  "password": "pass123", "role": "event_coordinator"},
]


def seed_users():
    for u in SEED_USERS:
        user = User(
            name=u["name"],
            email=u["email"],
            password_hash=generate_password_hash(u["password"]),
            role=u["role"],
        )
        db.session.add(user)
    db.session.commit()
    print("✅ Users seeded")
