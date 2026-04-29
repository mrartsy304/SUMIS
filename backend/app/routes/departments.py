from flask import Blueprint, jsonify, request

# NOTE: flask_login (@login_required / current_user) is intentionally NOT
# imported here. The Auth blueprint (JWT / session-based login) is not yet
# implemented in SUMIS. Applying @login_required now would crash every request
# because Flask-Login has no user_loader registered yet.
#
# The PUT endpoint is guarded with _require_admin() — a minimal placeholder
# that will be replaced with @login_required + role check once the Auth
# blueprint is merged.

from app.services.department_service import (
    get_all_departments,
    get_department_by_id,
    search_departments_by_name,
    update_department,
)

departments_bp = Blueprint("departments", __name__, url_prefix="/api/departments")


def _require_admin():
    """
    Temporary admin guard — checks for a static dev token in the
    X-Admin-Token request header.

    Set ADMIN_DEV_TOKEN in your .env file.
    Example:  ADMIN_DEV_TOKEN=supersecretdevtoken

    Returns a (response, status_code) tuple if the check fails, or None if
    the caller is allowed to proceed.
    """
    import os
    expected = os.getenv("ADMIN_DEV_TOKEN", "")
    provided = request.headers.get("X-Admin-Token", "")

    if not expected:
        return jsonify({"error": "Admin token not configured on server"}), 500

    if provided != expected:
        return jsonify({"error": "Forbidden: admin access required"}), 403

    return None


# ── Routes ────────────────────────────────────────────────────────────────────
# Static routes are registered BEFORE dynamic ones so Flask does not try to
# coerce the string "search" as an integer parameter.

@departments_bp.get("/search")
def search_departments():
    """
    GET /api/departments/search?q=<keyword>
    Case-insensitive search across name, description, and services.
    Returns [] when q is empty or missing.
    """
    keyword = request.args.get("q", "", type=str)

    if not keyword.strip():
        return jsonify([]), 200

    results = search_departments_by_name(keyword)
    return jsonify([d.to_dict() for d in results]), 200


@departments_bp.get("/")
def list_departments():
    """GET /api/departments/ — returns all departments ordered by name."""
    departments = get_all_departments()
    return jsonify([d.to_dict() for d in departments]), 200


@departments_bp.get("/<int:department_id>")
def get_department(department_id: int):
    """GET /api/departments/<id> — returns one department or 404."""
    department = get_department_by_id(department_id)
    if not department:
        return jsonify({"error": "Department not found"}), 404

    return jsonify(department.to_dict()), 200


@departments_bp.put("/<int:department_id>")
def update_department_route(department_id: int):
    """
    PUT /api/departments/<id>
    Admin-only endpoint — protected by _require_admin() dev token guard.
    Replace with @login_required + role check once Auth blueprint is live.
    """
    err = _require_admin()
    if err:
        return err

    payload = request.get_json(silent=True) or {}

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400

    if not payload:
        return jsonify({"error": "No fields provided to update"}), 400

    updated = update_department(department_id, payload)
    if not updated:
        return jsonify({"error": "Department not found"}), 404

    return jsonify(updated.to_dict()), 200