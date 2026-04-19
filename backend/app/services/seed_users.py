"""
backend/app/services/seed_users.py

Run once to create test users in the database:
    cd backend
    python -c "from app.services.seed_users import seed_users; from app import create_app; app = create_app()
    with app.app_context(): seed_users()"

Or add this call inside create_app() in __init__.py:
    from app.services.seed_users import seed_users
    seed_users()     # safe — skips if users already exist
"""

from werkzeug.security import generate_password_hash
from app.models import db
from app.models.user import User


def seed_users():
    if User.query.count() > 0:
        return   # already seeded

    test_users = [
        {"name": "Admin User",   "email": "admin@sumis.edu",   "role": "admin",             "password": "admin123"},
        {"name": "Abdul Qadir",  "email": "qadir@sumis.edu",   "role": "student",           "password": "student123"},
        {"name": "Dr. Imran",    "email": "imran@sumis.edu",   "role": "faculty",           "password": "faculty123"},
        {"name": "Staff User",   "email": "staff@sumis.edu",   "role": "staff",             "password": "staff123"},
        {"name": "Event Coord",  "email": "events@sumis.edu",  "role": "event_coordinator", "password": "events123"},
    ]

    for u in test_users:
        user = User(
            name  = u["name"],
            email = u["email"],
            role  = u["role"],
            # Try setting password_hash — if your User model uses a plain `password`
            # field instead, swap the line below to: password = u["password"]
            password_hash = generate_password_hash(u["password"]),
        )
        db.session.add(user)

    db.session.commit()
    print("✅ Test users seeded")
    print("   admin@sumis.edu   / admin123")
    print("   qadir@sumis.edu   / student123")
    print("   imran@sumis.edu   / faculty123")