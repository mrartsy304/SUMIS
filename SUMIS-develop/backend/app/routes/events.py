from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import text
from app.models import db

events_bp = Blueprint("events", __name__, url_prefix="/api/events")


def _parse_deadline(value):
    """Accept 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM' or None."""
    if not value:
        return None
    value = str(value).strip()
    if len(value) == 10:          # date only → add midnight UTC
        value = value + "T00:00:00"
    return value


def _event_row(row, reg_count=None):
    d = {
        "id":                    row.id,
        "title":                 row.title,
        "description":           row.description,
        "event_date":            row.event_date.isoformat() if row.event_date else None,
        "capacity":              row.capacity,
        "registration_deadline": row.registration_deadline.isoformat() if row.registration_deadline else None,
        "location":              row.location,
        "created_by":            row.created_by,
        "created_at":            row.created_at.isoformat() if row.created_at else None,
    }
    if reg_count is not None:
        d["registered_count"] = reg_count
        d["is_full"] = row.capacity is not None and reg_count >= row.capacity
    return d


@events_bp.get("")
@login_required
def get_events():
    rows = db.session.execute(text("""
        SELECT e.*, COUNT(er.id) AS reg_count
        FROM events e
        LEFT JOIN event_registrations er ON er.event_id = e.id
        GROUP BY e.id
        ORDER BY e.event_date
    """)).fetchall()
    return jsonify([_event_row(r, r.reg_count) for r in rows])


@events_bp.get("/<int:event_id>")
@login_required
def get_event(event_id):
    row = db.session.execute(text("""
        SELECT e.*, COUNT(er.id) AS reg_count
        FROM events e
        LEFT JOIN event_registrations er ON er.event_id = e.id
        WHERE e.id = :id
        GROUP BY e.id
    """), {"id": event_id}).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_event_row(row, row.reg_count))


@events_bp.post("")
@login_required
def create_event():
    if current_user.role not in ("event_coordinator", "admin"):
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    if not data.get("title") or not data.get("event_date"):
        return jsonify({"error": "title and event_date are required"}), 400

    row = db.session.execute(text("""
        INSERT INTO events (title, description, event_date, capacity, registration_deadline, location, created_by, created_at)
        VALUES (:title, :desc, :event_date, :capacity, :deadline, :location, :created_by, NOW())
        RETURNING *
    """), {
        "title":      data["title"],
        "desc":       data.get("description", ""),
        "event_date": data["event_date"],
        "capacity":   data.get("capacity"),
        "deadline":   _parse_deadline(data.get("registration_deadline")),
        "location":   data.get("location", ""),
        "created_by": current_user.id,
    }).fetchone()
    db.session.commit()
    return jsonify(_event_row(row, 0)), 201


@events_bp.put("/<int:event_id>")
@login_required
def update_event(event_id):
    if current_user.role not in ("event_coordinator", "admin"):
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    if not data.get("title") or not data.get("event_date"):
        return jsonify({"error": "title and event_date are required"}), 400

    row = db.session.execute(text("""
        UPDATE events
        SET title                = :title,
            description          = :desc,
            event_date           = :event_date,
            capacity             = :capacity,
            registration_deadline = :deadline,
            location             = :location
        WHERE id = :id
        RETURNING *
    """), {
        "title":      data["title"],
        "desc":       data.get("description", ""),
        "event_date": data["event_date"],
        "capacity":   data.get("capacity"),
        "deadline":   _parse_deadline(data.get("registration_deadline")),
        "location":   data.get("location", ""),
        "id":         event_id,
    }).fetchone()
    db.session.commit()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_event_row(row))


@events_bp.delete("/<int:event_id>")
@login_required
def delete_event(event_id):
    if current_user.role not in ("event_coordinator", "admin"):
        return jsonify({"error": "Forbidden"}), 403
    result = db.session.execute(
        text("DELETE FROM events WHERE id = :id RETURNING id"), {"id": event_id}
    )
    db.session.commit()
    if not result.fetchone():
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Deleted"})


@events_bp.post("/register")
@login_required
def register_event():
    data     = request.json
    event_id = data.get("event_id")

    event = db.session.execute(text("""
        SELECT e.*, COUNT(er.id) AS reg_count
        FROM events e
        LEFT JOIN event_registrations er ON er.event_id = e.id
        WHERE e.id = :id
        GROUP BY e.id
    """), {"id": event_id}).fetchone()
    if not event:
        return jsonify({"error": "Event not found"}), 404

    from datetime import datetime, timezone
    if event.registration_deadline and event.registration_deadline < datetime.now(timezone.utc):
        return jsonify({"error": "Registration deadline passed"}), 400

    if event.capacity and event.reg_count >= event.capacity:
        return jsonify({"error": "Event is full"}), 400

    existing = db.session.execute(text("""
        SELECT id FROM event_registrations WHERE event_id = :eid AND user_id = :uid
    """), {"eid": event_id, "uid": current_user.id}).fetchone()
    if existing:
        return jsonify({"error": "Already registered"}), 409

    row = db.session.execute(text("""
        INSERT INTO event_registrations (event_id, user_id, registered_at)
        VALUES (:eid, :uid, NOW()) RETURNING *
    """), {"eid": event_id, "uid": current_user.id}).fetchone()
    db.session.commit()
    return jsonify({"id": row.id, "event_id": row.event_id, "user_id": row.user_id}), 201


@events_bp.delete("/register/<int:reg_id>")
@login_required
def cancel_registration(reg_id):
    reg = db.session.execute(
        text("SELECT * FROM event_registrations WHERE id = :id"), {"id": reg_id}
    ).fetchone()
    if not reg:
        return jsonify({"error": "Not found"}), 404
    if reg.user_id != current_user.id and current_user.role not in ("event_coordinator", "admin"):
        return jsonify({"error": "Forbidden"}), 403
    db.session.execute(text("DELETE FROM event_registrations WHERE id = :id"), {"id": reg_id})
    db.session.commit()
    return jsonify({"message": "Cancelled"})