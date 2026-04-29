from . import db


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    event_date = db.Column(
        db.Date,
        nullable=False
    )

    capacity = db.Column(
        db.Integer
    )

    registrations = db.relationship(
        "EventRegistration",
        backref="event",
        lazy=True
    )
