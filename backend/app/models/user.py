"""from . import db
from sqlalchemy.sql import func

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(30), nullable=False)

    created_at = db.Column(
        db.DateTime,
        server_default=func.now(), 
        nullable=False
    )

    service_requests = db.relationship(
        "ServiceRequest",
        backref="student",
        lazy=True
    )

    complaints = db.relationship(
        "Complaint",
        backref="user",
        lazy=True
    )

    notifications = db.relationship(
        "Notification",
        backref="recipient",
        lazy=True
    )
"""

from . import db
from sqlalchemy.sql import func

class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role          = db.Column(db.String(30), nullable=False)

    created_at = db.Column(
        db.DateTime,
        server_default=func.now(),
        nullable=False
    )