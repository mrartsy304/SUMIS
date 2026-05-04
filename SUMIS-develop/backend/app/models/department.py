from . import db


class Department(db.Model):
    """
    Department entity — FR-02: Department Information Management.

    Relationships to ServiceRequest and Complaint have been intentionally
    removed until those models are implemented by their respective team members.
    Uncomment the relationship blocks below once those models exist.
    """

    __tablename__ = "departments"

    id                = db.Column(db.Integer,     primary_key=True)
    name              = db.Column(db.String(100), nullable=False, unique=True)
    building_location = db.Column(db.String(150))
    contact_email     = db.Column(db.String(120))
    contact_phone     = db.Column(db.String(50))
    description       = db.Column(db.Text)
    services          = db.Column(db.Text)

    # ── Relationships (uncomment when the target models are implemented) ──────

    # FR-05–09: uncomment once ServiceRequest model exists
    # service_requests = db.relationship(
    #     "ServiceRequest",
    #     backref="department",
    #     lazy=True,
    # )

    # FR-10–13: uncomment once Complaint model exists
    # complaints = db.relationship(
    #     "Complaint",
    #     backref="assigned_department",
    #     lazy=True,
    # )

    def to_dict(self) -> dict:
        """Serialize to a JSON-safe dict for API responses."""
        return {
            "id":                self.id,
            "name":              self.name,
            "building_location": self.building_location,
            "contact_email":     self.contact_email,
            "contact_phone":     self.contact_phone,
            "description":       self.description,
            "services":          self.services,
        }