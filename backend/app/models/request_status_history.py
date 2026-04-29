from . import db
from datetime import datetime


class RequestStatusHistory(db.Model):
    __tablename__ = "request_status_history"

    id = db.Column(db.Integer, primary_key=True)

    request_id = db.Column(
        db.Integer,
        db.ForeignKey("service_requests.id"),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False
    )

    remarks = db.Column(
        db.Text
    )

    updated_at = db.Column(
        db.DateTime
    )
