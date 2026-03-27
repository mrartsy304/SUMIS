from flask import Blueprint, jsonify, request

from app.services.department_service import (
    get_department_by_id,
    search_departments_by_name_only,
)


location_bp = Blueprint("location", __name__, url_prefix="/api/location")


def _department_location_payload(dept):
    return {
        "id": dept.id,
        "name": dept.name,
        "building_location": dept.building_location,
        "building_lat": dept.building_lat,
        "building_lng": dept.building_lng,
    }


@location_bp.get("/search")
def search_locations():
    """
    GET /api/location/search?q=<department_name>
    Returns basic department + coordinates for map usage.
    """
    keyword = request.args.get("q", "", type=str)
    if not keyword.strip():
        return jsonify([]), 200

    results = search_departments_by_name_only(keyword)
    return jsonify([_department_location_payload(d) for d in results]), 200


@location_bp.get("/department/<int:department_id>")
def get_department_location(department_id: int):
    """
    GET /api/location/department/<id>
    Returns department building location coordinates.
    """
    dept = get_department_by_id(department_id)
    if not dept:
        return jsonify({"error": "Department not found"}), 404

    return jsonify(_department_location_payload(dept)), 200

