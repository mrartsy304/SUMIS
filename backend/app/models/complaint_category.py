from . import db


class ComplaintCategory(db.Model):
    __tablename__ = "complaint_category"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(50),
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    complaints = db.relationship(
        "Complaint",
        backref="category",
        lazy=True
    )
