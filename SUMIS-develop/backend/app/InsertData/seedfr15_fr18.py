"""
One-time migration script for FR-15 to FR-18 tables.
Run: python migrate_fr15_fr18.py
This is safe to run multiple times (all operations are IF NOT EXISTS).
"""
import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Running FR-15 → FR-18 migrations...")

    # FR-15: Add missing columns to events table
    for col, col_type in [
        ("registration_deadline", "TIMESTAMP WITH TIME ZONE"),
        ("location",              "VARCHAR(200)"),
        ("created_by",            "INTEGER"),
        ("created_at",            "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
    ]:
        exists = db.session.execute(text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name='events' AND column_name=:col"
        ), {"col": col}).fetchone()
        if not exists:
            db.session.execute(text(f"ALTER TABLE events ADD COLUMN {col} {col_type}"))
            db.session.commit()
            print(f"  ✅ events.{col} added")
        else:
            print(f"  ✓  events.{col} already exists")

    # FR-15: event_registrations table
    # Drop old singular table if both exist
    old_tbl = db.session.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_name='event_registration'"
    )).fetchone()
    new_tbl = db.session.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_name='event_registrations'"
    )).fetchone()
    if old_tbl and new_tbl:
        db.session.execute(text("DROP TABLE event_registration CASCADE"))
        db.session.commit()
        print("  ✅ old event_registration table dropped (event_registrations already exists)")
    elif old_tbl and not new_tbl:
        db.session.execute(text("ALTER TABLE event_registration RENAME TO event_registrations"))
        sid = db.session.execute(text(
            "SELECT 1 FROM information_schema.columns WHERE table_name='event_registrations' AND column_name='student_id'"
        )).fetchone()
        if sid:
            db.session.execute(text("ALTER TABLE event_registrations RENAME COLUMN student_id TO user_id"))
        db.session.commit()
        print("  ✅ event_registration renamed to event_registrations")

    er_exists = db.session.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_name='event_registrations'"
    )).fetchone()
    if not er_exists:
        db.session.execute(text("""
            CREATE TABLE event_registrations (
                id               SERIAL PRIMARY KEY,
                event_id         INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                user_id          INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
                registered_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                attendance_status VARCHAR(20) DEFAULT 'registered',
                marked_at        TIMESTAMP WITH TIME ZONE,
                marked_by        INTEGER REFERENCES users(id),
                UNIQUE(event_id, user_id)
            )
        """))
        db.session.commit()
        print("  ✅ event_registrations table created")
    else:
        print("  ✓  event_registrations already exists")
        # Ensure attendance columns exist
        for col, col_type in [
            ("attendance_status", "VARCHAR(20) DEFAULT 'registered'"),
            ("marked_at",         "TIMESTAMP WITH TIME ZONE"),
            ("marked_by",         "INTEGER"),
        ]:
            exists = db.session.execute(text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='event_registrations' AND column_name=:col"
            ), {"col": col}).fetchone()
            if not exists:
                db.session.execute(text(f"ALTER TABLE event_registrations ADD COLUMN {col} {col_type}"))
                db.session.commit()
                print(f"    ✅ event_registrations.{col} added")

    # FR-17: campus_announcements table
    ann_exists = db.session.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_name='campus_announcements'"
    )).fetchone()
    if not ann_exists:
        db.session.execute(text("""
            CREATE TABLE campus_announcements (
                id           SERIAL PRIMARY KEY,
                title        VARCHAR(200) NOT NULL,
                body         TEXT         NOT NULL,
                priority     VARCHAR(20)  DEFAULT 'normal',
                target_roles VARCHAR(50)  DEFAULT 'all',
                is_deleted   BOOLEAN      DEFAULT FALSE,
                created_by   INTEGER REFERENCES users(id),
                created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        db.session.commit()
        print("  ✅ campus_announcements table created")
    else:
        print("  ✓  campus_announcements already exists")

    # FR-18: user_notifications table
    notif_exists = db.session.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_name='user_notifications'"
    )).fetchone()
    if not notif_exists:
        db.session.execute(text("""
            CREATE TABLE user_notifications (
                id         SERIAL PRIMARY KEY,
                user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title      VARCHAR(200),
                body       TEXT    NOT NULL,
                type       VARCHAR(30) DEFAULT 'info',
                is_read    BOOLEAN     DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        db.session.commit()
        print("  ✅ user_notifications table created")
    else:
        print("  ✓  user_notifications already exists")

    # Seed a sample announcement if empty
    count = db.session.execute(text("SELECT COUNT(*) FROM campus_announcements")).scalar()
    if count == 0:
        db.session.execute(text("""
            INSERT INTO campus_announcements (title, body, priority, target_roles) VALUES
            ('Welcome to SUMIS', 'The Student University Management Information System is now live. Use the portal to submit requests, track complaints, and register for events.', 'high', 'all'),
            ('Semester Registration Open', 'Course registration for the upcoming semester is now open. Visit the Registrar office or use the portal.', 'urgent', 'student'),
            ('Faculty Meeting', 'All faculty members are requested to attend the departmental meeting on Friday at 2pm in Block A.', 'normal', 'faculty')
        """))
        db.session.commit()
        print("  ✅ Sample announcements seeded")

    print("\nMigration complete ✅")