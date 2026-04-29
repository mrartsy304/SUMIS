from app.models import db
from app.models.support_unit import SupportUnit


SUPPORT_UNITS = [
    {
        "name": "IT Support",
        "description": "Handles all technology-related issues including internet, hardware, and software problems."
    },
    {
        "name": "Hostel Management",
        "description": "Manages hostel facilities, accommodation complaints, and resident services."
    },
    {
        "name": "Administration",
        "description": "Handles general administrative complaints including library and miscellaneous issues."
    },
    {
        "name": "Accounts",
        "description": "Manages fee-related issues, financial queries, and payment complaints."
    },
    {
        "name": "Maintenance & Facilities",
        "description": "Responsible for physical infrastructure, transport, and facility maintenance."
    },
    {
        "name": "Academic Affairs",
        "description": "Handles academic complaints, curriculum issues, and faculty-related concerns."
    },
]


def seed_support_units():
    """Seed the support_units table with the 6 operational support units."""
    for unit_data in SUPPORT_UNITS:
        existing = SupportUnit.query.filter_by(name=unit_data["name"]).first()
        if not existing:
            unit = SupportUnit(
                name=unit_data["name"],
                description=unit_data["description"]
            )
            db.session.add(unit)
    db.session.commit()
    print("✅ Support units seeded")
