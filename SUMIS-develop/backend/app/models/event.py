from . import db
from datetime import datetime


class Event(db.Model):
    __tablename__ = "events"

    id                    = db.Column(db.Integer, primary_key=True)
    title                 = db.Column(db.String(150), nullable=False)
    description           = db.Column(db.Text)
    event_date            = db.Column(db.Date, nullable=False)
    capacity              = db.Column(db.Integer)
    registration_deadline = db.Column(db.DateTime(timezone=True))
    location              = db.Column(db.String(200))
    created_by            = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at            = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    registrations = db.relationship(
        "EventRegistration",
        backref="event",
        lazy=True,
        foreign_keys="EventRegistration.event_id"
    )