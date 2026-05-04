from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import text
from app.models import db

location_bp = Blueprint("location", __name__, url_prefix="/api/location")


def _row_to_dict(row):
    return {
        "id": row.id,
        "name": row.name,
        "type": row.type,
        "floor": row.floor,
        "area": row.area,
        "room": row.room,
        "direction": row.direction,
        "building": row.building,
        "formatted_direction": f"{row.floor}, {row.area}, Room {row.room}",
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@location_bp.get("/search")
@login_required
def search_locations():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "q is required"}), 400
    rows = db.session.execute(text("""
        SELECT * FROM campus_locations
        WHERE name ILIKE :q OR area ILIKE :q OR building ILIKE :q
           OR direction ILIKE :q OR floor ILIKE :q
        ORDER BY name
    """), {"q": f"%{q}%"}).fetchall()
    return jsonify([_row_to_dict(r) for r in rows])


@location_bp.get("")
@login_required
def get_all():
    rows = db.session.execute(text("SELECT * FROM campus_locations ORDER BY name")).fetchall()
    return jsonify([_row_to_dict(r) for r in rows])


@location_bp.get("/buildings")
@login_required
def get_buildings():
    rows = db.session.execute(text(
        "SELECT DISTINCT building FROM campus_locations WHERE building IS NOT NULL ORDER BY building"
    )).fetchall()
    return jsonify([r.building for r in rows])


@location_bp.get("/<int:loc_id>")
@login_required
def get_one(loc_id):
    row = db.session.execute(text("SELECT * FROM campus_locations WHERE id = :id"), {"id": loc_id}).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_row_to_dict(row))


@location_bp.post("")
@login_required
def create_location():
    if current_user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    row = db.session.execute(text("""
        INSERT INTO campus_locations (name, type, floor, area, room, direction, building, created_at, updated_at)
        VALUES (:name, :type, :floor, :area, :room, :direction, :building, NOW(), NOW())
        RETURNING *
    """), {
        "name": data["name"], "type": data.get("type", "department"),
        "floor": data.get("floor", ""), "area": data.get("area", ""),
        "room": data.get("room", ""), "direction": data.get("direction", ""),
        "building": data.get("building", ""),
    }).fetchone()
    db.session.commit()
    return jsonify(_row_to_dict(row)), 201


@location_bp.put("/<int:loc_id>")
@login_required
def update_location(loc_id):
    if current_user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    row = db.session.execute(text("""
        UPDATE campus_locations
        SET name=:name, type=:type, floor=:floor, area=:area, room=:room,
            direction=:direction, building=:building, updated_at=NOW()
        WHERE id=:id RETURNING *
    """), {
        "name": data["name"], "type": data.get("type", "department"),
        "floor": data.get("floor", ""), "area": data.get("area", ""),
        "room": data.get("room", ""), "direction": data.get("direction", ""),
        "building": data.get("building", ""), "id": loc_id,
    }).fetchone()
    db.session.commit()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_row_to_dict(row))


@location_bp.delete("/<int:loc_id>")
@login_required
def delete_location(loc_id):
    if current_user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403
    result = db.session.execute(text("DELETE FROM campus_locations WHERE id=:id RETURNING id"), {"id": loc_id})
    db.session.commit()
    if not result.fetchone():
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Deleted"})
