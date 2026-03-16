from . import db
from datetime import datetime


class EventRegistration(db.Model):
    __tablename__ = "event_registration"

    id = db.Column(db.Integer, primary_key=True)

    event_id = db.Column(
        db.Integer,
        db.ForeignKey("events.id"),
        nullable=False
    )

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    attendance_status = db.Column(
        db.String(20),
        default="registered"
    )

    registered_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
