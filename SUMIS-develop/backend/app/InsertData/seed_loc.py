"""
Seed/update campus_locations with proper floor, dept, room data.
Run: python seed_locations.py
Clears and re-seeds all location data.
"""
import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.models import db
from sqlalchemy import text

app = create_app()

LOCATIONS = [
    # (name, type, floor, area, room, direction, building)
    ("CS Department Office",        "department",      "First Floor",   "Dept of Computer Science",      "Room 101", "Enter main gate → turn left → first floor stairs", "Academic Block A"),
    ("SE Department Office",        "department",      "Second Floor",  "Dept of Software Engineering",  "Room 201", "Block B stairs near cafeteria → second floor",     "Academic Block B"),
    ("AI Department Office",        "department",      "Third Floor",   "Dept of Artificial Intelligence","Room 301", "Block C elevator → third floor → turn right",      "Academic Block C"),
    ("Data Science Department",     "department",      "Fourth Floor",  "Dept of Data Science",          "Room 401", "Block D staircase near main entrance → floor 4",   "Academic Block D"),
    ("AI Research Lab",             "lab",             "Third Floor",   "Dept of Artificial Intelligence","Room 305", "Block C elevator → third floor → end of corridor", "Academic Block C"),
    ("Data Science Lab",            "lab",             "Fourth Floor",  "Dept of Data Science",          "Room 405", "Block D → fourth floor → left wing",               "Academic Block D"),
    ("Physics Lab",                 "lab",             "First Floor",   "Science Block",                 "Room 102", "Science Block entrance → first floor → right",     "Science Block"),
    ("Chemistry Lab",               "lab",             "First Floor",   "Science Block",                 "Room 104", "Science Block → first floor → opposite Physics Lab","Science Block"),
    ("Software Engineering Lab",    "lab",             "Second Floor",  "Dept of Software Engineering",  "Room 210", "Block B → second floor → lab corridor",            "Academic Block B"),
    ("Registrar Office",            "service_counter", "Ground Floor",  "Administration Block",          "Room 005", "Straight from main entrance → ground floor",       "Administration Block"),
    ("Finance Office",              "service_counter", "Ground Floor",  "Administration Block",          "Room 010", "Main entrance → ground floor → right side",        "Administration Block"),
    ("Student Affairs Office",      "service_counter", "First Floor",   "Student Centre",                "Room 110", "Student Centre → first floor → left corridor",     "Student Centre"),
    ("Library",                     "service_counter", "Ground Floor",  "Library Block",                 "Room 001", "Opposite cafeteria → ground floor entrance",       "Library Block"),
    ("IT Help Desk",                "service_counter", "Ground Floor",  "Dept of Computer Science",      "Room 005", "Block A entrance → ground floor → IT counter",    "Academic Block A"),
    ("Dean Office",                 "department",      "Second Floor",  "Administration Block",          "Room 201", "Admin Block → second floor → end of hall",         "Administration Block"),
    ("Examination Department",      "service_counter", "First Floor",   "Administration Block",          "Room 115", "Admin Block → first floor → examination wing",     "Administration Block"),
    ("Transport Office",            "service_counter", "Ground Floor",  "Student Centre",                "Room 002", "Student Centre → ground floor → near parking",     "Student Centre"),
    ("Medical Room",                "service_counter", "Ground Floor",  "Student Centre",                "Room 008", "Student Centre → ground floor → health wing",      "Student Centre"),
    ("Cafeteria",                   "service_counter", "Ground Floor",  "Student Centre",                "Room 000", "Central campus → ground floor → main courtyard",  "Student Centre"),
    ("Prayer Room",                 "service_counter", "First Floor",   "Student Centre",                "Room 105", "Student Centre → first floor → east wing",         "Student Centre"),
]

with app.app_context():
    # Ensure table exists
    tbl = db.session.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_name='campus_locations'"
    )).fetchone()
    if not tbl:
        db.session.execute(text("""
            CREATE TABLE campus_locations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                type VARCHAR(30) DEFAULT 'department',
                floor VARCHAR(50),
                area VARCHAR(100),
                room VARCHAR(50),
                direction TEXT,
                building VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        db.session.commit()
        print("✅ campus_locations table created")

    # Clear and re-seed
    db.session.execute(text("DELETE FROM campus_locations"))
    db.session.commit()
    print("🗑  Cleared existing locations")

    for name, ltype, floor, area, room, direction, building in LOCATIONS:
        db.session.execute(text("""
            INSERT INTO campus_locations (name, type, floor, area, room, direction, building)
            VALUES (:name, :type, :floor, :area, :room, :direction, :building)
        """), {
            "name": name, "type": ltype, "floor": floor,
            "area": area, "room": room, "direction": direction, "building": building
        })

    db.session.commit()
    print(f"✅ Seeded {len(LOCATIONS)} locations")
    print()

    rows = db.session.execute(text("SELECT name, floor, area, room FROM campus_locations ORDER BY name")).fetchall()
    for r in rows:
        print(f"  {r.name:<35} → {r.floor}, {r.area}, {r.room}")