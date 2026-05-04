from . import db
from datetime import datetime


class ComplaintStatusHistory(db.Model):
    __tablename__ = "complaint_status_history"

    id = db.Column(db.Integer, primary_key=True)

    complaint_id = db.Column(
        db.Integer,
        db.ForeignKey("complaints_v2.id"),
        nullable=False
    )

    old_status = db.Column(
        db.String(20),
        nullable=True   # null for the first entry (creation)
    )

    new_status = db.Column(
        db.String(20),
        nullable=False
    )

    changed_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    note = db.Column(
        db.String(255),
        nullable=True
    )

    changed_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # Relationship back to the user who changed the status
    changed_by_user = db.relationship(
        "User",
        foreign_keys=[changed_by],
        lazy=True
    )
