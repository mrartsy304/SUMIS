"""
Seed sample notifications for all users.
Run: python seed_notifications.py
Safe to run multiple times — clears existing notifications first.
"""
import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.models import db
from app.models.user import User
from sqlalchemy import text

app = create_app()

NOTIFICATIONS = {
    "student": [
        ("Request Approved",         "Your transcript request has been approved and is ready for pickup at the Registrar office.", "success"),
        ("Event Registration Open",  "Registration for the Annual Tech Fest is now open. Seats are limited — register early.", "info"),
        ("Fee Reminder",             "Your semester fee payment is due in 7 days. Visit the Finance office or pay online.", "warning"),
        ("Appointment Confirmed",    "Your appointment with Dr. Imran has been confirmed for Friday at 11:00 AM.", "success"),
        ("New Announcement",         "Important update regarding semester registration dates — check the Announcements page.", "info"),
    ],
    "faculty": [
        ("Appointment Request",      "A student has requested an appointment with you for academic guidance. Please review.", "info"),
        ("Department Meeting",       "Reminder: Faculty meeting is scheduled for Friday at 2:00 PM in Block A, Room 101.", "warning"),
        ("New Complaint Assigned",   "A student complaint has been assigned to your department for review.", "info"),
        ("System Update",            "SUMIS has been updated with new features. Check the portal for the latest changes.", "info"),
    ],
    "staff": [
        ("Pending Requests",         "You have 3 service requests pending review in your queue.", "warning"),
        ("Request Escalated",        "A service request has been escalated and requires immediate attention.", "warning"),
        ("Task Completed",           "The IT maintenance task you submitted has been marked as completed.", "success"),
        ("New Assignment",           "A new service request has been routed to your department.", "info"),
    ],
    "admin": [
        ("System Alert",             "5 service requests have been pending for more than 48 hours.", "warning"),
        ("New User Registered",      "A new faculty member account has been created and is awaiting role assignment.", "info"),
        ("Report Ready",             "The monthly operations report for April is now available in the Reports section.", "success"),
        ("Complaint Unresolved",     "2 complaints have been open for more than 7 days without a status update.", "warning"),
        ("Database Backup",          "Scheduled database backup completed successfully.", "success"),
    ],
    "event_coordinator": [
        ("Event Registration Full",  "Tech Fest 2025 has reached full capacity — 120 registrations confirmed.", "success"),
        ("Attendance Pending",       "Attendance has not been marked for last week's seminar. Please update.", "warning"),
        ("New Event Approved",       "Your request to create the AI Workshop event has been approved by admin.", "success"),
        ("Announcement Published",   "Your announcement about the Career Fair has been published successfully.", "info"),
    ],
}

with app.app_context():
    # Ensure user_notifications table exists
    tbl = db.session.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_name='user_notifications'"
    )).fetchone()
    if not tbl:
        db.session.execute(text("""
            CREATE TABLE user_notifications (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title      VARCHAR(200),
                body       TEXT NOT NULL,
                type       VARCHAR(30) DEFAULT 'info',
                is_read    BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        db.session.commit()
        print("✅ user_notifications table created")

    users = User.query.all()
    if not users:
        print("❌ No users found. Run the main seed first.")
        exit(1)

    # Clear existing notifications
    db.session.execute(text("DELETE FROM user_notifications"))
    db.session.commit()
    print("🗑  Cleared existing notifications")

    total = 0
    for user in users:
        notifs = NOTIFICATIONS.get(user.role, NOTIFICATIONS["student"])
        for i, (title, body, ntype) in enumerate(notifs):
            # Make every other one unread so the badge shows activity
            is_read = (i % 2 == 0)
            db.session.execute(text("""
                INSERT INTO user_notifications (user_id, title, body, type, is_read, created_at)
                VALUES (:uid, :title, :body, :type, :is_read,
                        NOW() - INTERVAL '1 hour' * :hrs)
            """), {
                "uid":     user.id,
                "title":   title,
                "body":    body,
                "type":    ntype,
                "is_read": is_read,
                "hrs":     (i + 1) * 3,
            })
            total += 1

    db.session.commit()
    print(f"✅ Seeded {total} notifications across {len(users)} users")
    print()

    # Summary
    for user in users:
        count = db.session.execute(text(
            "SELECT COUNT(*) FROM user_notifications WHERE user_id=:uid"
        ), {"uid": user.id}).scalar()
        unread = db.session.execute(text(
            "SELECT COUNT(*) FROM user_notifications WHERE user_id=:uid AND is_read=FALSE"
        ), {"uid": user.id}).scalar()
        print(f"  {user.name:<20} ({user.role:<20}) → {count} notifications, {unread} unread")