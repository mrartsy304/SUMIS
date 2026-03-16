from . import db
from datetime import datetime


class ServiceRequest(db.Model):
    __tablename__ = "service_requests"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    department_id = db.Column(
        db.Integer,
        db.ForeignKey("departments.id")
    )

    request_type = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    status = db.Column(
        db.String(30),
        default="pending"
    )

    created_at = db.Column(
        db.DateTime
    )

    completed_at = db.Column(
        db.DateTime
    )

    status_history = db.relationship(
        "RequestStatusHistory",
        backref="service_request",
        lazy=True
    )
