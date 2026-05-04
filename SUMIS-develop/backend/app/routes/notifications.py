from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import text
from app.models import db

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def _row(r):
    return {
        "id": r.id,
        "user_id": r.user_id,
        "title": r.title,
        "body": r.body,
        "type": r.type,
        "is_read": r.is_read,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@notifications_bp.post("")
@login_required
def create_notification():
    if current_user.role not in ("admin", "event_coordinator", "staff"):
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    user_id = data.get("user_id")
    row = db.session.execute(text("""
        INSERT INTO user_notifications (user_id, title, body, type, is_read, created_at)
        VALUES (:uid, :title, :body, :type, FALSE, NOW()) RETURNING *
    """), {
        "uid": user_id, "title": data.get("title", ""),
        "body": data.get("body", ""), "type": data.get("type", "info"),
    }).fetchone()
    db.session.commit()
    return jsonify(_row(row)), 201


@notifications_bp.get("/me")
@login_required
def my_notifications():
    rows = db.session.execute(text("""
        SELECT * FROM user_notifications WHERE user_id=:uid ORDER BY created_at DESC
    """), {"uid": current_user.id}).fetchall()
    return jsonify([_row(r) for r in rows])


@notifications_bp.get("/me/unread-count")
@login_required
def unread_count():
    row = db.session.execute(text("""
        SELECT COUNT(*) AS cnt FROM user_notifications WHERE user_id=:uid AND is_read=FALSE
    """), {"uid": current_user.id}).fetchone()
    return jsonify({"unread_count": row.cnt})


@notifications_bp.post("/<int:notif_id>/read")
@login_required
def mark_read(notif_id):
    db.session.execute(text("""
        UPDATE user_notifications SET is_read=TRUE WHERE id=:id AND user_id=:uid
    """), {"id": notif_id, "uid": current_user.id})
    db.session.commit()
    return jsonify({"message": "Marked read"})


@notifications_bp.post("/read-all")
@login_required
def read_all():
    db.session.execute(text("""
        UPDATE user_notifications SET is_read=TRUE WHERE user_id=:uid
    """), {"uid": current_user.id})
    db.session.commit()
    return jsonify({"message": "All read"})



@notifications_bp.get("/user/<int:user_id>")
@login_required
def get_user_notifications(user_id):
    # Allow user to get their own, or admin to get any
    if current_user.id != user_id and current_user.role not in ("admin", "staff"):
        return jsonify({"error": "Forbidden"}), 403
    rows = db.session.execute(text("""        SELECT * FROM user_notifications WHERE user_id=:uid ORDER BY created_at DESC
    """), {"uid": user_id}).fetchall()
    return jsonify([_row(r) for r in rows])

@notifications_bp.delete("/<int:notif_id>")
@login_required
def delete_notification(notif_id):
    result = db.session.execute(text("""
        DELETE FROM user_notifications WHERE id=:id AND user_id=:uid RETURNING id
    """), {"id": notif_id, "uid": current_user.id})
    db.session.commit()
    if not result.fetchone():
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Deleted"})
