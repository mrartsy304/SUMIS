from . import db
from datetime import datetime


class Announcement(db.Model):
    __tablename__ = "announcements"

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(150), nullable=False)
    message     = db.Column(db.Text, nullable=False)
    created_by  = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    # FR-04 fields
    content_type        = db.Column(db.String(20), nullable=False, default="announcement")
    category            = db.Column(db.String(50),  nullable=True)
    steps               = db.Column(db.JSON,         nullable=True)
    estimated_duration  = db.Column(db.String(50),   nullable=True)
    is_active           = db.Column(db.Boolean, nullable=False, default=True)

    def to_summary_dict(self):
        return {
            "id":                 self.id,
            "title":              self.title,
            "category":           self.category,
            "estimated_duration": self.estimated_duration,
            "created_at":         self.created_at.isoformat() if self.created_at else None,
        }

    def to_detail_dict(self):
        return {
            "id":                 self.id,
            "title":              self.title,
            "message":            self.message,
            "category":           self.category,
            "steps":              self.steps or [],
            "estimated_duration": self.estimated_duration,
            "is_active":          self.is_active,
            "created_at":         self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Announcement id={self.id} type={self.content_type} title={self.title!r}>"