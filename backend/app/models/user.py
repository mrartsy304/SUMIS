"""
backend/app/models/user.py

BUG NOTE (do NOT re-enable the complaints relationship below):
  The Complaint model in complaint.py already defines:
      user = db.relationship("User", backref=db.backref("complaints", lazy="dynamic"), ...)
  Re-enabling the block below would create two backrefs named "complaints" on
  the User mapper, causing SQLAlchemy to raise an error on startup.
  User.complaints is accessible via the backref defined in complaint.py.
"""

from . import db
from sqlalchemy.sql import func
from flask_login import UserMixin


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer,     primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text,        nullable=False)
    role          = db.Column(db.String(30),  nullable=False)

    created_at    = db.Column(
        db.DateTime,
        server_default=func.now(),
        nullable=False,
    )

    service_requests = db.relationship(
        "ServiceRequest",
        backref="student",
        lazy=True,
    )

    # ── complaints ────────────────────────────────────────────────────────────
    # DO NOT uncomment — the backref "complaints" is already defined in
    # complaint.py via:
    #   backref=db.backref("complaints", lazy="dynamic")
    # Enabling this block causes:
    #   "Error creating backref 'complaints': property of that name exists on mapper"
    #
    # complaints = db.relationship(
    #     "Complaint",
    #     backref="user",
    #     lazy=True,
    # )

    notifications = db.relationship(
        "Notification",
        backref="recipient",
        lazy=True,
    )