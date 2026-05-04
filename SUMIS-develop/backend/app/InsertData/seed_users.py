"""
seed_users.py — Replace all student/faculty users with real FAST-NUCES data.
Run from the backend/ directory:
    python seed_users.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.models import db
from werkzeug.security import generate_password_hash

app = create_app()

STUDENTS = [
    ("23I-0545", "Gotam Dulhani"),
    ("23I-0760", "Sameer Rajani"),
    ("23K-0005", "Rizwan Vadsariya"),
    ("23K-0007", "Hani Ali"),
    ("23K-0017", "Muhammad Fasih"),
    ("23K-0031", "Muhammad Soban"),
    ("23K-0036", "Rimsha Amjad"),
    ("23K-0526", "Abdul Basit"),
    ("23K-0537", "Hasan Mustafa"),
    ("23K-0551", "Shayan Ahmed"),
    ("23K-0557", "Rayyan Amir"),
    ("23K-0559", "Royam Ali"),
    ("23K-0561", "Hamza Nasir"),
    ("23K-0571", "Fatima Mukhtar"),
    ("23K-0577", "Taha Zaidi"),
    ("23K-0578", "Muneeb Ul"),
    ("23K-0582", "Ahmed Arif"),
    ("23K-0583", "Taaha Khan"),
    ("23K-0611", "Muhammad Kumail"),
    ("23K-0621", "Suhaib Raza"),
    ("23K-0622", "Ali Mobin"),
    ("23K-0625", "Aaqib"),
    ("23K-0631", "Rayyan Ali"),
    ("23K-0633", "Hassaan Tariq"),
    ("23K-0640", "Ali Zain"),
    ("23K-0646", "Wania Fatima"),
    ("23K-0650", "Muhammad Harmain"),
    ("23K-0663", "Ali Hadi"),
    ("23K-0674", "Abdul Qadir"),
    ("23K-0706", "Kissa Zehra"),
    ("23K-0736", "Aiza"),
    ("23K-0756", "Alishba"),
    ("23K-0769", "Hassan Nafees"),
    ("23K-0808", "Arfeen Ahmed"),
    ("23K-0820", "Usman Ahmed"),
    ("23K-0832", "Shameer Irfan"),
    ("23K-0856", "Amna Khan"),
    ("23K-0886", "Fatima"),
    ("23K-0892", "Aniqua Haseen"),
    ("23K-0894", "Mohat Kumar"),
    ("23K-0897", "Shaheer Malik"),
    ("23K-0901", "Afaq Ahmed"),
    ("23K-2027", "Hanzala Ramzan"),
    ("23K-3000", "Mohid Raheel"),
    ("23K-5545", "Muhammad Mustafa"),
    ("24K-0820", "Minaal Fatima"),
]

FACULTY = [
    ("Prof. Dr. Zulfiqar Ali Memon", "zulfiqar.memon@nu.edu.pk"),
    ("Dr. Jawwad Ahmed Shamsi",      "jawwad.shamsi@nu.edu.pk"),
    ("Dr. Ghufran Ahmed",            "ghufran.ahmed@nu.edu.pk"),
    ("Dr. Fahad Samad",              "fahad.samad@nu.edu.pk"),
    ("Dr. Muhammad Rafi",            "muhammad.rafi@nu.edu.pk"),
    ("Dr. Muhammad Shahzad Shaikh", "shahzad.shaikh@nu.edu.pk"),
    ("Dr. Nouman Durrani",           "muhammad.nouman@nu.edu.pk"),
    ("Dr. Shakil Ahmed",             "shakil.ahmed@nu.edu.pk"),
    ("Dr. Nadeem Kafi",              "nadeem.kafi@nu.edu.pk"),
    ("Dr. Farrukh Salim Shaikh",     "farrukh.salim@nu.edu.pk"),
    ("Dr. Aqsa Aslam",               "aqsa.aslam@nu.edu.pk"),
    ("Dr. Nasir Uddin",              "nasir.uddin@nu.edu.pk"),
    ("Dr. Rabia Tabassum",           "rabia.tabassum@nu.edu.pk"),
    ("Dr. Kamran Ali",               "kamran.ali@nu.edu.pk"),
    ("Mr. Muhammad Jamil",           "m.jamil@nu.edu.pk"),
    ("Ms. Shahar Bano Husnine",      "shahar.bano@nu.edu.pk"),
    ("Mr. Shoaib Rauf",              "shoaib.rauf@nu.edu.pk"),
]

DEFAULT_PASSWORD = "sumis1234"


def roll_to_email(roll: str) -> str:
    parts  = roll.split("-")
    prefix = parts[0]
    number = parts[1]
    year   = prefix[:-1]
    letter = prefix[-1].lower()
    return f"{letter}{year}{number}@sumis.edu"


def safe_delete(cur, table, col, id_csv):
    """Delete rows using a savepoint so failures don't abort the transaction."""
    cur.execute("SAVEPOINT sp")
    try:
        cur.execute(f"DELETE FROM {table} WHERE {col} IN ({id_csv})")
        cur.execute("RELEASE SAVEPOINT sp")
        print(f"  cleaned {table}.{col} ({cur.rowcount} rows)")
        return True
    except Exception as e:
        cur.execute("ROLLBACK TO SAVEPOINT sp")
        cur.execute("RELEASE SAVEPOINT sp")
        print(f"  skipped {table}.{col} ({e.__class__.__name__})")
        return False


with app.app_context():
    raw = db.engine.raw_connection()
    cur = raw.cursor()

    try:
        # 1. Get IDs to remove
        cur.execute("SELECT id FROM users WHERE role IN ('student','faculty')")
        target_ids = [r[0] for r in cur.fetchall()]

        if not target_ids:
            print("No existing student/faculty users — nothing to remove.")
        else:
            id_csv = ",".join(str(i) for i in target_ids)
            print(f"Found {len(target_ids)} student/faculty users to remove.\n")

            # 2. Delete leaf tables first (no children), deepest dependencies first.
            #    Use savepoints so any failure is isolated.

            # complaint_status_history references complaints_v2
            safe_delete(cur, "complaint_status_history", "complaint_id",
                        f"SELECT id FROM complaints_v2 WHERE user_id IN ({id_csv})")

            # complaints_v2 children
            safe_delete(cur, "complaint_status_history", "changed_by", id_csv)

            # request_status_history references service_requests
            safe_delete(cur, "request_status_history", "request_id",
                        f"SELECT id FROM service_requests WHERE student_id IN ({id_csv})")
            safe_delete(cur, "request_status_history", "changed_by", id_csv)

            # now safe to delete complaints_v2 and service_requests
            safe_delete(cur, "complaints_v2",        "user_id",     id_csv)
            safe_delete(cur, "complaints_v2",        "assigned_to", id_csv)
            safe_delete(cur, "complaints",           "user_id",     id_csv)
            safe_delete(cur, "service_requests",     "student_id",  id_csv)

            # other direct refs
            safe_delete(cur, "appointments",         "student_id",  id_csv)
            safe_delete(cur, "appointments",         "faculty_id",  id_csv)
            safe_delete(cur, "event_registrations",  "user_id",     id_csv)
            safe_delete(cur, "events",               "created_by",  id_csv)
            safe_delete(cur, "notifications",        "user_id",     id_csv)
            safe_delete(cur, "user_notifications",   "user_id",     id_csv)
            safe_delete(cur, "campus_announcements", "created_by",  id_csv)

            # 3. Delete users
            cur.execute(f"DELETE FROM users WHERE id IN ({id_csv})")
            print(f"\nRemoved {cur.rowcount} users.")

        # 4. Insert new users
        pw_hash = generate_password_hash(DEFAULT_PASSWORD)

        for roll, name in STUDENTS:
            cur.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (%s,%s,%s,%s)",
                (name, roll_to_email(roll), pw_hash, "student")
            )

        for name, email in FACULTY:
            cur.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (%s,%s,%s,%s)",
                (name, email, pw_hash, "faculty")
            )

        raw.commit()

        print(f"\nSeeded {len(STUDENTS)} students + {len(FACULTY)} faculty.")
        print(f"Default password for all: '{DEFAULT_PASSWORD}'\n")
        print("Sample student logins:")
        for roll, name in STUDENTS[:3]:
            print(f"  {roll_to_email(roll)}  /  {DEFAULT_PASSWORD}  ({name})")
        print("\nSample faculty logins:")
        for name, email in FACULTY[:3]:
            print(f"  {email}  /  {DEFAULT_PASSWORD}  ({name})")

    except Exception as e:
        raw.rollback()
        raise
    finally:
        cur.close()
        raw.close()