from . import db
from datetime import datetime


class EventRegistration(db.Model):
    __tablename__ = "event_registrations"

    id                = db.Column(db.Integer, primary_key=True)
    event_id          = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    user_id           = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    attendance_status = db.Column(db.String(20), default="registered")
    registered_at     = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    marked_at         = db.Column(db.DateTime(timezone=True))
    marked_by         = db.Column(db.Integer, db.ForeignKey("users.id"))