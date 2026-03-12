from . import db


class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    office_location = db.Column(
        db.String(100)
    )

    contact_email = db.Column(
        db.String(120)
    )

    service_requests = db.relationship(
        "ServiceRequest",
        backref="department",
        lazy=True
    )

    complaints = db.relationship(
        "Complaint",
        backref="assigned_department",
        lazy=True
    )
