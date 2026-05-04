from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from sqlalchemy import text
from app.models import db

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.get("/service-demand")
@login_required
def service_demand():
    if current_user.role not in ("admin", "event_coordinator", "staff"):
        return jsonify({"error": "Forbidden"}), 403

    top_types = db.session.execute(text("""
        SELECT COALESCE(type, request_type) AS type, COUNT(*) AS count
        FROM service_requests
        GROUP BY COALESCE(type, request_type)
        ORDER BY count DESC
        LIMIT 10
    """)).fetchall()

    weekly_trends = db.session.execute(text("""
        SELECT
            DATE_TRUNC('week', created_at) AS week,
            COUNT(*) AS count
        FROM service_requests
        WHERE created_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY week ORDER BY week
    """)).fetchall()

    monthly_trends = db.session.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*) AS count
        FROM service_requests
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month ORDER BY month
    """)).fetchall()

    peak_days = db.session.execute(text("""
        SELECT TO_CHAR(created_at, 'Day') AS day_name,
               EXTRACT(DOW FROM created_at) AS day_num,
               COUNT(*) AS count
        FROM service_requests
        GROUP BY day_name, day_num ORDER BY day_num
    """)).fetchall()

    peak_hours = db.session.execute(text("""
        SELECT EXTRACT(HOUR FROM created_at) AS hour, COUNT(*) AS count
        FROM service_requests
        GROUP BY hour ORDER BY hour
    """)).fetchall()

    current_month = db.session.execute(text("""
        SELECT COUNT(*) AS count FROM service_requests
        WHERE created_at >= DATE_TRUNC('month', NOW())
    """)).fetchone()

    prev_month = db.session.execute(text("""
        SELECT COUNT(*) AS count FROM service_requests
        WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
        AND created_at < DATE_TRUNC('month', NOW())
    """)).fetchone()

    by_category = db.session.execute(text("""
        SELECT COALESCE(category, 'Uncategorized') AS category, COUNT(*) AS count
        FROM service_requests
        GROUP BY category ORDER BY count DESC
    """)).fetchall()

    return jsonify({
        "top_types": [{"type": r.type, "count": r.count} for r in top_types],
        "weekly_trends": [{"week": r.week.isoformat() if r.week else None, "count": r.count} for r in weekly_trends],
        "monthly_trends": [{"month": r.month, "count": r.count} for r in monthly_trends],
        "peak_days": [{"day": r.day_name.strip(), "count": r.count} for r in peak_days],
        "peak_hours": [{"hour": int(r.hour), "count": r.count} for r in peak_hours],
        "comparison": {
            "current_month": current_month.count,
            "previous_month": prev_month.count,
            "change_pct": round(
                ((current_month.count - prev_month.count) / max(prev_month.count, 1)) * 100, 1
            ),
        },
        "by_category": [{"category": r.category, "count": r.count} for r in by_category],
    })
