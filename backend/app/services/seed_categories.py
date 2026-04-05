from app.models.complaint_category import ComplaintCategory
from app.models import db


def seed_categories():
    """
    Seed complaint categories if table is empty.
    Called inside app context from __init__.py
    """
    if ComplaintCategory.query.count() == 0:
        categories = [
            ComplaintCategory(name="Academic",       description="Issues related to courses, grades, and academic matters"),
            ComplaintCategory(name="Facilities",     description="Issues related to buildings, labs, and physical infrastructure"),
            ComplaintCategory(name="Administration", description="Issues related to admin processes and documentation"),
            ComplaintCategory(name="IT Support",     description="Issues related to software, hardware, and internet"),
            ComplaintCategory(name="Financial",      description="Issues related to fees, scholarships, and payments"),
            ComplaintCategory(name="Other",          description="Any other issues not covered above"),
        ]
        db.session.add_all(categories)
        db.session.commit()
        print("✅ Complaint categories seeded")
