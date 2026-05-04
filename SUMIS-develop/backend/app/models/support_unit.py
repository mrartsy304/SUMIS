from . import db
from datetime import datetime


class SupportUnit(db.Model):
    __tablename__ = "support_units"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.String(255)
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    complaints = db.relationship(
        "ComplaintV2",
        backref="support_unit",
        lazy=True
    )
