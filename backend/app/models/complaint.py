"""
backend/app/models/complaint.py

FR-10 | Complaint model

BUG FIXED:
  The relationship below uses backref=db.backref("complaints", lazy="dynamic").
  user.py previously had a COMMENTED-OUT duplicate relationship with the same
  backref name "complaints".  That commented block is left commented in user.py
  and must never be re-enabled — SQLAlchemy would raise:
      "Error creating backref 'complaints' on relationship 'Complaint.user':
       property of that name exists on mapper 'User'"
  This file is the single owner of the User <-> Complaint relationship.
"""

from datetime import datetime, timezone
from app.models import db


class Complaint(db.Model):
    __tablename__ = "complaints"

    id          = db.Column(db.Integer,     primary_key=True)
    user_id     = db.Column(db.Integer,     db.ForeignKey("users.id", ondelete="SET NULL"),
                            nullable=True, index=True)
    title       = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text,        nullable=False)

    # Must match VALID_CATEGORIES in routes/Complaints.py
    category    = db.Column(
        db.Enum("Facility", "IT", "Academic", "Administrative", "Other",
                name="complaint_category_enum"),
        nullable=False,
    )

    # Must match VALID_PRIORITIES in routes/Complaints.py
    priority    = db.Column(
        db.Enum("Low", "Medium", "High", "Critical",
                name="complaint_priority_enum"),
        nullable=False,
    )

    # STATUS: default is always "Pending"; admin can set to "Completed"
    status      = db.Column(
        db.Enum("Pending", "Completed", name="complaint_status_enum"),
        nullable=False,
        default="Pending",
        server_default="Pending",
    )

    created_at  = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=db.func.now(),
        nullable=False,
    )
    updated_at  = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=db.func.now(),
        nullable=False,
    )

    # ── Relationship ─────────────────────────────────────────────────────────
    # lazy="joined" avoids N+1 on list endpoints.
    # backref="complaints" adds User.complaints — do NOT define this again in user.py.
    user = db.relationship(
        "User",
        backref=db.backref("complaints", lazy="dynamic"),
        lazy="joined",
        foreign_keys=[user_id],
    )

    # ─────────────────────────────────────────────────────────────────────────
    def to_dict(self, include_user: bool = False) -> dict:
        data = {
            "id":          self.id,
            "user_id":     self.user_id,
            "title":       self.title,
            "description": self.description,
            "category":    self.category,
            "priority":    self.priority,
            "status":      self.status,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_user:
            if self.user:
                data["user"] = {
                    "id":    self.user.id,
                    "name":  getattr(self.user, "name",  None) or getattr(self.user, "username", None),
                    "email": getattr(self.user, "email", None),
                    "role":  getattr(self.user, "role",  None),
                }
            else:
                data["user"] = None
        return data

    def __repr__(self):
        return f"<Complaint id={self.id} status={self.status} priority={self.priority}>"