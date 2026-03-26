from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.department import Department
from app import db

staff_bp = Blueprint("staff", __name__, url_prefix="/api/staff")

# Roles considered faculty / staff in SUMIS
STAFF_ROLES = ["faculty", "staff", "event_coordinator", "admin"]


# ─────────────────────────────────────────────────────────────
#  GET /api/staff/search?q=<name>&role=<role>
#  Search faculty/staff by name, email, or role
#  Uses: user.py
#  Note: department join pending — User has no department_id FK yet.
#        Once that FK is added, replace the department block below.
# ─────────────────────────────────────────────────────────────
@staff_bp.get("/search")
def search_staff():
    query       = request.args.get("q", "").strip()
    role_filter = request.args.get("role", "").strip()

    staff_query = User.query.filter(User.role.in_(STAFF_ROLES))

    if query:
        staff_query = staff_query.filter(
            db.or_(
                User.name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
            )
        )

    if role_filter and role_filter in STAFF_ROLES:
        staff_query = staff_query.filter(User.role == role_filter)

    members = staff_query.order_by(User.name.asc()).all()

    return jsonify({
        "results": [_serialize(m) for m in members],
        "count":   len(members),
        "query":   query,
    }), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/staff/all
#  Return every faculty / staff member — used to populate list
# ─────────────────────────────────────────────────────────────
@staff_bp.get("/all")
def get_all_staff():
    members = (
        User.query
        .filter(User.role.in_(STAFF_ROLES))
        .order_by(User.name.asc())
        .all()
    )
    return jsonify({"staff": [_serialize(m) for m in members], "count": len(members)}), 200


# ─────────────────────────────────────────────────────────────
#  GET /api/staff/<id>
#  Single staff/faculty member — includes department lookup
#  from Ali's Department model (building_location, services, etc.)
# ─────────────────────────────────────────────────────────────
@staff_bp.get("/<int:staff_id>")
def get_staff(staff_id):
    member = User.query.get(staff_id)

    if not member:
        return jsonify({"error": "Staff member not found"}), 404

    if member.role not in STAFF_ROLES:
        return jsonify({"error": "User is not a staff or faculty member"}), 403

    return jsonify(_serialize(member)), 200


# ─────────────────────────────────────────────────────────────
#  Helper
# ─────────────────────────────────────────────────────────────
def _serialize(member: User) -> dict:
    """
    Serialize a User to a staff-facing dict.

    department_id does not exist on User yet — once Ali adds it,
    replace the department block with:

        dept = Department.query.get(member.department_id)
        department = dept.to_dict() if dept else None
        office_location = dept.building_location if dept else None
    """
    return {
        "id":              member.id,
        "name":            member.name,
        "email":           member.email,
        "role":            member.role,
        "department":      None,   # pending department_id FK on User
        "office_location": None,   # will be department.building_location
        "created_at":      member.created_at.isoformat() if member.created_at else None,
    }
