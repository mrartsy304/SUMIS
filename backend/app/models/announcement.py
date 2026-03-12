from . import db
from datetime import datetime


class Announcement(db.Model):
    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(150),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
