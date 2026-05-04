from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import text
from app.models import db

announcements_bp = Blueprint("announcements", __name__, url_prefix="/api/announcements")


def _row(r):
    return {
        "id": r.id,
        "title": r.title,
        "body": r.body,
        "priority": r.priority,
        "target_roles": r.target_roles,
        "is_deleted": r.is_deleted,
        "created_by": r.created_by,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


@announcements_bp.get("")
@login_required
def get_announcements():
    rows = db.session.execute(text("""
        SELECT * FROM campus_announcements WHERE is_deleted = FALSE ORDER BY created_at DESC
    """)).fetchall()
    return jsonify([_row(r) for r in rows])


@announcements_bp.get("/archive")
@login_required
def get_archive():
    if current_user.role not in ("admin", "event_coordinator"):
        return jsonify({"error": "Forbidden"}), 403
    rows = db.session.execute(text("""
        SELECT * FROM campus_announcements WHERE is_deleted = TRUE ORDER BY created_at DESC
    """)).fetchall()
    return jsonify([_row(r) for r in rows])


@announcements_bp.get("/<int:ann_id>")
@login_required
def get_one(ann_id):
    row = db.session.execute(text(
        "SELECT * FROM campus_announcements WHERE id = :id"
    ), {"id": ann_id}).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_row(row))


@announcements_bp.post("")
@login_required
def create_announcement():
    if current_user.role not in ("admin", "event_coordinator"):
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    row = db.session.execute(text("""
        INSERT INTO campus_announcements (title, body, priority, target_roles, created_by, created_at, updated_at, is_deleted)
        VALUES (:title, :body, :priority, :target_roles, :created_by, NOW(), NOW(), FALSE)
        RETURNING *
    """), {
        "title": data["title"], "body": data.get("body", ""),
        "priority": data.get("priority", "normal"),
        "target_roles": data.get("target_roles", "all"),
        "created_by": current_user.id,
    }).fetchone()
    db.session.commit()
    return jsonify(_row(row)), 201


@announcements_bp.put("/<int:ann_id>")
@login_required
def update_announcement(ann_id):
    if current_user.role not in ("admin", "event_coordinator"):
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    row = db.session.execute(text("""
        UPDATE campus_announcements
        SET title=:title, body=:body, priority=:priority, target_roles=:target_roles, updated_at=NOW()
        WHERE id=:id RETURNING *
    """), {
        "title": data["title"], "body": data.get("body", ""),
        "priority": data.get("priority", "normal"),
        "target_roles": data.get("target_roles", "all"),
        "id": ann_id,
    }).fetchone()
    db.session.commit()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_row(row))


@announcements_bp.delete("/<int:ann_id>")
@login_required
def delete_announcement(ann_id):
    if current_user.role not in ("admin", "event_coordinator"):
        return jsonify({"error": "Forbidden"}), 403
    row = db.session.execute(text("""
        UPDATE campus_announcements SET is_deleted=TRUE, updated_at=NOW()
        WHERE id=:id RETURNING id
    """), {"id": ann_id}).fetchone()
    db.session.commit()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Archived"})
