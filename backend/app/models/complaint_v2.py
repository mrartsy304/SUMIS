from . import db
from datetime import datetime


# ─────────────────────────────────────────────────────────────
#  ComplaintV2 — Full complaint model for FR-10 to FR-13
#  (named V2 to avoid conflict with the existing Complaint model)
# ─────────────────────────────────────────────────────────────

ALLOWED_CATEGORIES = [
    "Internet Issue",
    "Hardware Issue",
    "Software Issue",
    "Hostel Issue",
    "Fee Issue",
    "Academic Issue",
    "Library Issue",
    "Transport Issue",
    "Other",
]

ALLOWED_PRIORITIES = ["Low", "Medium", "High"]
ALLOWED_STATUSES   = ["Pending", "In Progress", "Resolved"]

# Category → SupportUnit name mapping
CATEGORY_UNIT_MAP = {
    "Internet Issue":  "IT Support",
    "Hardware Issue":  "IT Support",
    "Software Issue":  "IT Support",
    "Hostel Issue":    "Hostel Management",
    "Fee Issue":       "Accounts",
    "Academic Issue":  "Academic Affairs",
    "Library Issue":   "Administration",
    "Transport Issue": "Maintenance & Facilities",
    "Other":           "Administration",
}


class ComplaintV2(db.Model):
    __tablename__ = "complaints_v2"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    category = db.Column(
        db.String(50),
        nullable=False
    )

    priority = db.Column(
        db.String(20),
        nullable=False,
        default="Medium"
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="Pending"
    )

    support_unit_id = db.Column(
        db.Integer,
        db.ForeignKey("support_units.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    status_history = db.relationship(
        "ComplaintStatusHistory",
        backref="complaint",
        lazy=True
    )
