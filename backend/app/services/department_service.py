from typing import List, Optional, Dict, Any

from app.models import db
from app.models.department import Department


def get_all_departments() -> List[Department]:
    """Return all departments ordered by name."""
    return Department.query.order_by(Department.name.asc()).all()


def get_department_by_id(department_id: int) -> Optional[Department]:
    """Return a single department by primary key, or None if not found."""
    return db.session.get(Department, department_id)


def search_departments_by_name(keyword: str) -> List[Department]:
    """
    Case-insensitive partial search on department name, description,
    and services columns. A query like 'labs' returns all departments
    that offer lab services, not just those with 'labs' in the name.
    """
    if not keyword:
        return []

    pattern = f"%{keyword.strip()}%"
    return (
        Department.query.filter(
            db.or_(
                Department.name.ilike(pattern),
                Department.description.ilike(pattern),
                Department.services.ilike(pattern),
            )
        )
        .order_by(Department.name.asc())
        .all()
    )


def search_departments_by_name_only(keyword: str) -> List[Department]:
    """Case-insensitive partial search on department name only."""
    if not keyword:
        return []

    pattern = f"%{keyword.strip()}%"
    return (
        Department.query.filter(Department.name.ilike(pattern))
        .order_by(Department.name.asc())
        .all()
    )


def update_department(department_id: int, data: Dict[str, Any]) -> Optional[Department]:
    """
    Update whitelisted fields on a Department and persist the change.
    Returns the updated instance or None if not found.
    """
    department = db.session.get(Department, department_id)
    if not department:
        return None

    updatable_fields = [
        "name",
        "building_location",
        "contact_email",
        "contact_phone",
        "description",
        "services",
    ]

    for field in updatable_fields:
        if field in data:
            setattr(department, field, data[field])

    db.session.commit()
    return department