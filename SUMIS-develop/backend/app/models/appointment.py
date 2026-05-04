from . import db
from datetime import datetime


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    faculty_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    appointment_time = db.Column(
        db.DateTime,
        nullable=False
    )

    status = db.Column(
        db.String(30),
        default="requested"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
