"""
SUMIS Full Dummy Data Seed Script — FR-01 to FR-20
Run from: backend/
Usage:  python seed_all.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta, date

# ── Bootstrap Flask app ──────────────────────────────────────────────────────
from sqlalchemy import text
from app import create_app
from app.models import db
from app.models.user                   import User
from app.models.department             import Department
from app.models.support_unit           import SupportUnit
from app.models.service_request        import ServiceRequest
from app.models.request_status_history import RequestStatusHistory
from app.models.complaint_v2           import ComplaintV2
from app.models.complaint_status_history import ComplaintStatusHistory
from app.models.appointment            import Appointment
from app.models.event                  import Event
from app.models.event_registration     import EventRegistration
from app.models.announcement           import Announcement
from app.models.notification           import Notification

app = create_app()

def ts(days_ago=0, hours_ago=0):
    return datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)

with app.app_context():

    # ── Guard: wipe only seed data (safe re-run) ─────────────────────────────
    print("🧹  Clearing existing seed data …")
    for M in [
        ComplaintStatusHistory, RequestStatusHistory,
        EventRegistration, Notification,
        ComplaintV2, ServiceRequest, Appointment,
        Event, Announcement,
    ]:
        db.session.query(M).delete()
    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  USERS  (students × 10, faculty × 5, staff × 3, admin × 1, coord × 1)
    # ────────────────────────────────────────────────────────────────────────
    print("👤  Seeding users …")

    def mk_user(name, email, role, pw="pass123"):
        u = User.query.filter_by(email=email).first()
        if not u:
            u = User(name=name, email=email,
                     password_hash=generate_password_hash(pw), role=role)
            db.session.add(u)
        return u

    # Students
    s1  = mk_user("Ali Mobin",          "ali.mobin@sumis.edu",        "student")
    s2  = mk_user("Usman Ahmed",        "usman.ahmed@sumis.edu",      "student")
    s3  = mk_user("Fatima Noor",        "fatima.noor@sumis.edu",      "student")
    s4  = mk_user("Hamza Raza",         "hamza.raza@sumis.edu",       "student")
    s5  = mk_user("Ayesha Siddiqui",    "ayesha.sid@sumis.edu",       "student")
    s6  = mk_user("Zain ul Abideen",    "zain.abideen@sumis.edu",     "student")
    s7  = mk_user("Sana Mirza",         "sana.mirza@sumis.edu",       "student")
    s8  = mk_user("Omar Farooq",        "omar.farooq@sumis.edu",      "student")
    s9  = mk_user("Nadia Baig",         "nadia.baig@sumis.edu",       "student")
    s10 = mk_user("Bilal Tariq",        "bilal.tariq@sumis.edu",      "student")

    # Faculty
    f1 = mk_user("Dr. Imran Khan",      "faculty@sumis.edu",          "faculty")
    f2 = mk_user("Prof. Sara Qureshi",  "sara.qureshi@sumis.edu",     "faculty")
    f3 = mk_user("Dr. Khalid Mehmood",  "khalid.mehmood@sumis.edu",   "faculty")
    f4 = mk_user("Ms. Rabia Hussain",   "rabia.hussain@sumis.edu",    "faculty")
    f5 = mk_user("Dr. Asad Bukhari",    "asad.bukhari@sumis.edu",     "faculty")

    # Staff
    st1 = mk_user("Staff User",         "staff@sumis.edu",            "staff")
    st2 = mk_user("Sadia Rehman",       "sadia.rehman@sumis.edu",     "staff")
    st3 = mk_user("Faisal Iqbal",       "faisal.iqbal@sumis.edu",     "staff")

    # Admin & Coordinator
    adm = mk_user("Admin User",         "admin@sumis.edu",            "admin")
    crd = mk_user("Event Coord",        "events@sumis.edu",           "event_coordinator")

    db.session.commit()

    students = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10]
    faculty  = [f1, f2, f3, f4, f5]

    # ────────────────────────────────────────────────────────────────────────
    #  FR-02  DEPARTMENTS
    # ────────────────────────────────────────────────────────────────────────
    print("🏢  Seeding departments …")

    def mk_dept(name, loc, email, phone, desc, services):
        d = Department.query.filter_by(name=name).first()
        if not d:
            d = Department(name=name, building_location=loc,
                           contact_email=email, contact_phone=phone,
                           description=desc, services=services)
            db.session.add(d)
        return d

    dept_cs   = mk_dept("Computer Science",    "Main Block, 2nd Floor, Room 201",
                         "cs@sumis.edu",        "021-111-128-128",
                         "Manages all CS undergraduate and graduate programs.",
                         "Degree Verification, Transcript, NOC Letter, Course Withdrawal")
    dept_reg  = mk_dept("Registrar Office",    "Admin Block, Ground Floor, Room G-02",
                         "registrar@sumis.edu", "021-111-128-129",
                         "Central office for academic records and official documents.",
                         "Transcript Request, Enrollment Certificate, Migration Certificate, Degree Issuance")
    dept_it   = mk_dept("IT Department",       "Server Room Block, Basement 1, Room B-04",
                         "it@sumis.edu",        "021-111-128-130",
                         "Provides technology infrastructure and support services.",
                         "Network Issue, Software Installation, Lab Access, Email Account")
    dept_acc  = mk_dept("Accounts Office",     "Admin Block, 1st Floor, Room 105",
                         "accounts@sumis.edu",  "021-111-128-131",
                         "Manages student fee records and financial transactions.",
                         "Fee Challan, Fine Clearance, Scholarship Verification, Payment Receipt")
    dept_lib  = mk_dept("Library",             "Library Block, Ground & 1st Floor",
                         "library@sumis.edu",   "021-111-128-132",
                         "University library providing books, journals and digital resources.",
                         "Library Card, Book Issue, Fine Clearance, Research Access")

    db.session.commit()
    depts = [dept_cs, dept_reg, dept_it, dept_acc, dept_lib]

    # ────────────────────────────────────────────────────────────────────────
    #  SUPPORT UNITS (already seeded via seed_support_units; ensure present)
    # ────────────────────────────────────────────────────────────────────────
    unit_names = {
        "IT Support":              "Handles internet, hardware, and software issues.",
        "Hostel Management":       "Manages hostel facilities and resident services.",
        "Administration":          "Handles general admin, library, and misc issues.",
        "Accounts":                "Manages fee-related issues and payment complaints.",
        "Maintenance & Facilities":"Responsible for infrastructure and transport.",
        "Academic Affairs":        "Handles academic complaints and faculty concerns.",
    }
    units = {}
    for uname, udesc in unit_names.items():
        u = SupportUnit.query.filter_by(name=uname).first()
        if not u:
            u = SupportUnit(name=uname, description=udesc)
            db.session.add(u)
            db.session.flush()
        units[uname] = u
    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  FR-01  LOCATIONS  — campus_locations table (raw SQL, separate from announcements)
    # ────────────────────────────────────────────────────────────────────────
    print("📍  Seeding locations (FR-01) …")
    loc_count = db.session.execute(text("SELECT COUNT(*) FROM campus_locations")).scalar()
    if loc_count == 0:
        db.session.execute(text("""
            INSERT INTO campus_locations (name, type, floor, area, room, direction, building) VALUES
            ('Admin Office',           'service_counter', 'Basement 1',   'Admin Block',       '4',   'Enter main gate, turn right at reception',          'Administration Block'),
            ('CS Department Office',   'department',      '2nd Floor',    'Main Block',        '201', 'Take stairs near cafeteria to 2nd floor',           'Academic Block'),
            ('IT Support Room',        'service_counter', 'Basement 1',   'Server Room Block', 'B-04','Accessible via back corridor',                      'Server Room Block'),
            ('Library',                'service_counter', 'Ground Floor', 'Library Block',     '001', 'Ground floor entrance on the left',                 'Library Block'),
            ('Accounts Office',        'service_counter', '1st Floor',    'Admin Block',       '105', 'Adjacent to the finance counter',                   'Administration Block'),
            ('Examination Hall',       'lab',             'Ground Floor', 'Main Block',        'G-10','Follow exam signs from main entrance',              'Academic Block'),
            ('Faculty Block',          'department',      '3rd Floor',    'Faculty Block',     '300', 'Each office labelled by faculty name',              'Faculty Block'),
            ('Hostel Office',          'service_counter', 'Ground Floor', 'Hostel Block A',    'W-01','Accessible from hostel main gate',                  'Hostel Block'),
            ('Sports Complex',         'lab',             'Ground Floor', 'Sports Block',      'S-01','Behind the cafeteria. Open Mon–Sat 3–7 PM',         'Sports Block'),
            ('Student Affairs Office', 'service_counter', 'Ground Floor', 'Admin Block',       'G-05','Next to main reception',                            'Administration Block'),
            ('Registrar Office',       'service_counter', 'Ground Floor', 'Admin Block',       'G-02','Straight from main entrance',                       'Administration Block'),
            ('Cafeteria',              'service_counter', 'Ground Floor', 'Main Block',        'G-01','Ground floor, right side near entrance',            'Academic Block')
        """))
        db.session.commit()
        print("   ✅ campus_locations inserted")
    else:
        print(f"   ℹ️  campus_locations already has {loc_count} rows — skipping")

    # ────────────────────────────────────────────────────────────────────────
    #  FR-04  PROCEDURES — stored as Announcements with content_type="procedure"
    # ────────────────────────────────────────────────────────────────────────
    print("📋  Seeding procedures (FR-04) …")
    procedures = [
        ("Transcript Request", "document", "3-5 working days", [
            "Log in to SUMIS and go to 'Submit Request'.",
            "Select request type: 'Official Transcript'.",
            "Enter number of copies and purpose (e.g., job application).",
            "Upload fee payment proof (Rs. 500 per copy from Accounts Office).",
            "Submit request. You will be notified when ready for collection.",
        ]),
        ("Course Withdrawal", "academic", "5-7 working days", [
            "Obtain the Course Withdrawal form from the Registrar Office or download from SUMIS.",
            "Get it signed by your faculty advisor.",
            "Submit the signed form at the Registrar Office counter.",
            "Pay any applicable fine at the Accounts Office (Rs. 200 after Week 3).",
            "Collect the acknowledgment slip. Status visible in SUMIS Request Tracker.",
        ]),
        ("NOC Letter Request", "document", "2-3 working days", [
            "Submit a Service Request on SUMIS selecting 'NOC Letter'.",
            "Mention the purpose (visa, bank account, scholarship).",
            "Department reviews and issues the letter signed by the HOD.",
            "Collect from the CS Department office or request email delivery.",
        ]),
        ("Library Fine Clearance", "clearance", "1 working day", [
            "Visit the Library Counter on Ground Floor.",
            "Request a fine statement — library staff will check your account.",
            "Pay the outstanding fine at the Accounts Office.",
            "Bring the payment receipt back to the Library Counter.",
            "Library staff will clear your account and issue a clearance slip.",
        ]),
        ("Enrollment Certificate", "document", "1-2 working days", [
            "Log in to SUMIS, go to 'Submit Request' and select 'Enrollment Certificate'.",
            "Specify the purpose (bank, embassy, employer).",
            "Request is auto-routed to Registrar Office.",
            "Certificate is prepared and notified to you via SUMIS.",
            "Collect from Registrar Office or download the digitally signed copy.",
        ]),
    ]
    for title, cat, dur, steps in procedures:
        exists = Announcement.query.filter_by(title=title, content_type="procedure").first()
        if not exists:
            db.session.add(Announcement(
                title=title, message=f"Procedure guide for: {title}",
                content_type="procedure", category=cat,
                steps=steps, estimated_duration=dur,
                created_by=adm.id, is_active=True,
                created_at=ts(60)
            ))
    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  FR-05 / FR-06 / FR-07 / FR-08 / FR-09  SERVICE REQUESTS
    # ────────────────────────────────────────────────────────────────────────
    print("📝  Seeding service requests (FR-05 to FR-09) …")

    request_data = [
        # (student, dept, type, desc, status, days_ago, decision, remarks, completed_days_ago)
        (s1,  dept_reg,  "Official Transcript",      "Need 2 copies for a job application at Systems Ltd.",           "completed",  20, "approved",  "Prepared. Please collect from counter.",  15),
        (s2,  dept_cs,   "NOC Letter",               "Required for internship at NetSol Technologies.",               "completed",  18, "approved",  "NOC issued and signed by HOD.",           14),
        (s3,  dept_reg,  "Enrollment Certificate",   "Embassy requires proof of enrollment for student visa.",        "approved",   12, "approved",  "Certificate ready. Collect within 3 days.", None),
        (s4,  dept_acc,  "Fee Challan Reissue",       "Lost the original challan for Spring 2026 semester.",           "in_progress", 8, None,       None,                                      None),
        (s5,  dept_cs,   "Course Withdrawal",        "Requesting withdrawal from CS-301 due to medical reasons.",     "in_progress", 7, None,       None,                                      None),
        (s6,  dept_it,   "Lab Access Extension",     "Need after-hours lab access for FYP development.",              "pending",     5, None,       None,                                      None),
        (s7,  dept_lib,  "Library Fine Clearance",   "Have paid the fine. Need clearance for degree verification.",   "completed",   25, "approved", "Fine cleared. Record updated.",           22),
        (s8,  dept_reg,  "Migration Certificate",    "Transferring to another university. Need migration certificate.", "rejected",   10, "rejected", "Dues not cleared. Settle accounts first.", None),
        (s9,  dept_cs,   "Degree Verification",      "Employer requesting official degree verification letter.",       "approved",    6, "approved", "Verification letter signed by Registrar.", None),
        (s10, dept_acc,  "Scholarship Verification", "PPSC requires proof of merit scholarship.",                     "pending",     3, None,       None,                                      None),
        (s1,  dept_it,   "Email Account Issue",      "University email not working since 2 days. Password reset fails.", "completed", 15, "approved", "Account restored. Please reset your password.", 13),
        (s2,  dept_reg,  "Official Transcript",      "Need transcript for MS admissions at LUMS.",                    "pending",     2, None,       None,                                      None),
        (s3,  dept_cs,   "NOC Letter",               "Internship at Teradata requires NOC from department.",          "in_progress", 4, None,       None,                                      None),
        (s4,  dept_lib,  "Library Card Reissue",     "Lost my library card. Need a replacement.",                     "completed",   30, "approved", "New card issued. Collect from counter.",  28),
        (s5,  dept_acc,  "Fine Reversal Request",    "Charged late fee in error — I paid on time. Bank slip attached.", "pending",  1, None,       None,                                      None),
        (s6,  dept_cs,   "Course Withdrawal",        "Withdrawing from CS-401 (Compiler Construction) due to overload.", "approved", 9, "approved", "Withdrawal approved. Grade will show W.", None),
        (s7,  dept_it,   "Software Installation",   "Need MATLAB installed on Lab PC #14 for my FYP.",               "in_progress", 6, None,       None,                                      None),
        (s8,  dept_reg,  "Enrollment Certificate",   "Required by National Bank for student account opening.",        "completed",  22, "approved", "Certificate issued and stamped.",         20),
        (s9,  dept_acc,  "Fee Challan Reissue",      "Challan for hostel semester fee lost. Need reprint.",            "pending",    2, None,       None,                                      None),
        (s10, dept_cs,   "Degree Verification",      "Job offer letter requires degree verification from university.", "in_progress", 5, None,       None,                                     None),
    ]

    status_flow = {
        "pending":     ["submitted"],
        "in_progress": ["submitted", "in_review"],
        "approved":    ["submitted", "in_review", "approved"],
        "rejected":    ["submitted", "in_review", "rejected"],
        "completed":   ["submitted", "in_review", "approved", "completed"],
    }

    requests = []
    for (student, dept, rtype, desc, status, days, decision, remarks, comp_days) in request_data:
        req = ServiceRequest(
            student_id=student.id,
            department_id=dept.id,
            request_type=rtype,
            description=desc,
            status=status,
            created_at=ts(days),
            completed_at=ts(comp_days) if comp_days else None,
        )
        db.session.add(req)
        db.session.flush()

        flow = status_flow.get(status, ["submitted"])
        for i, st in enumerate(flow):
            hist_remark = remarks if (st in ("approved","rejected","completed") and remarks) else None
            db.session.add(RequestStatusHistory(
                request_id=req.id,
                status=st,
                remarks=hist_remark,
                updated_at=ts(days) + timedelta(hours=i*4)
            ))
        requests.append(req)

    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  FR-10 / FR-11 / FR-12 / FR-13  COMPLAINTS V2
    # ────────────────────────────────────────────────────────────────────────
    print("⚠️   Seeding complaints (FR-10 to FR-13) …")

    complaint_data = [
        # (student, title, desc, category, priority, status, unit_name, days_ago, resolution_note)
        (s1,  "WiFi Down in CS Block",         "No internet on 2nd floor CS block since morning. Cannot access SUMIS or email.", "Internet Issue",  "High",   "Resolved",     "IT Support",               14, "Router replaced. Service restored."),
        (s2,  "Lab PC #7 Not Working",         "PC #7 in Lab 1 fails to boot. Error message on screen during startup.",          "Hardware Issue",  "High",   "Resolved",     "IT Support",               10, "Hard drive replaced and OS reinstalled."),
        (s3,  "Hostel Washroom Broken",        "Tap in washroom B-3 has been leaking for a week. Water wastage is severe.",      "Hostel Issue",    "Medium", "In Progress",  "Hostel Management",         7, None),
        (s4,  "Fee Portal Not Loading",        "Fee payment portal gives 504 error. Cannot pay this semester's fees.",           "Software Issue",  "High",   "Resolved",     "IT Support",                5, "Server issue resolved by IT team."),
        (s5,  "Wrong Grade Entered",           "Grade for CS-201 Data Structures shows F but I passed with 65 marks.",           "Academic Issue",  "High",   "In Progress",  "Academic Affairs",          4, None),
        (s6,  "Library AC Not Working",        "Air conditioning in the library reading room has been off for 3 days.",          "Hostel Issue",    "Medium", "Pending",      "Hostel Management",         2, None),
        (s7,  "Duplicate Fee Challan Charged", "Charged twice for the same semester. Bank confirms double deduction.",           "Fee Issue",       "High",   "In Progress",  "Accounts",                  6, None),
        (s8,  "Projector Broken in Room 301",  "Projector in Room 301 (CS Block) not working. Affecting lectures.",              "Hardware Issue",  "Medium", "Resolved",     "IT Support",               20, "Projector lamp replaced. Working now."),
        (s9,  "Transport Van Not Arriving",    "University van for Bahria Town route has been absent for 2 days.",               "Transport Issue", "High",   "Pending",      "Maintenance & Facilities",  1, None),
        (s10, "Library Book Not Returned",     "Returned book on 15 April but fine still shows in system.",                      "Library Issue",   "Low",    "Resolved",     "Administration",            15, "Record corrected. Fine cleared from account."),
        (s1,  "Slow Internet Speed",           "Internet speed in hostel room A-12 drops to near zero after 8 PM.",             "Internet Issue",  "Medium", "In Progress",  "IT Support",                3, None),
        (s2,  "Chair Broken in Classroom",     "Three chairs in Room G-10 are broken. Safety hazard for students.",             "Hostel Issue",    "Low",    "Resolved",     "Hostel Management",         25, "Chairs replaced by maintenance team."),
        (s3,  "Software License Expired",      "Adobe Premiere Pro license expired in Lab 3. Cannot complete video project.",   "Software Issue",  "Medium", "Pending",      "IT Support",                2, None),
        (s4,  "Attendance Marked Wrong",       "Marked absent on 28 April but I was present. Teacher signed my attendance.",    "Academic Issue",  "Medium", "In Progress",  "Academic Affairs",          3, None),
        (s5,  "Canteen Overcharging",          "Canteen charged Rs. 350 for a meal listed at Rs. 180 on the menu board.",       "Other",           "Low",    "Pending",      "Administration",            1, None),
    ]

    for (student, title, desc, cat, prio, status, unit_name, days, res_note) in complaint_data:
        unit = units.get(unit_name)
        c = ComplaintV2(
            user_id=student.id,
            title=title, description=desc,
            category=cat, priority=prio, status=status,
            support_unit_id=unit.id if unit else None,
            created_at=ts(days),
            updated_at=ts(max(days-1, 0))
        )
        db.session.add(c)
        db.session.flush()

        # Status history — FR-13
        hist_entries = [("Pending", None)]
        if status == "In Progress":
            hist_entries.append(("In Progress", "Assigned to support unit for investigation."))
        elif status == "Resolved":
            hist_entries.append(("In Progress", "Assigned to support unit for investigation."))
            hist_entries.append(("Resolved", res_note))

        prev = None
        for i, (new_st, note) in enumerate(hist_entries):
            db.session.add(ComplaintStatusHistory(
                complaint_id=c.id,
                old_status=prev, new_status=new_st,
                changed_by=adm.id,
                note=note,
                changed_at=ts(days) + timedelta(hours=i*6)
            ))
            prev = new_st

    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  FR-14  APPOINTMENTS
    # ────────────────────────────────────────────────────────────────────────
    print("📅  Seeding appointments (FR-14) …")

    appt_data = [
        (s1,  f1, ts(-2, 0),   "confirmed"),   # future
        (s2,  f2, ts(-3, 0),   "confirmed"),
        (s3,  f1, ts(1),       "confirmed"),
        (s4,  f3, ts(2),       "completed"),
        (s5,  f2, ts(5),       "completed"),
        (s6,  f4, ts(1),       "requested"),
        (s7,  f5, ts(-1, 0),   "requested"),
        (s8,  f1, ts(4),       "cancelled"),
        (s9,  f3, ts(3),       "completed"),
        (s10, f4, ts(-2, 0),   "confirmed"),
    ]
    for (student, fac, appt_time, status) in appt_data:
        db.session.add(Appointment(
            student_id=student.id,
            faculty_id=fac.id,
            appointment_time=appt_time,
            status=status,
            created_at=ts(7)
        ))
    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  FR-15 / FR-16  EVENTS & ATTENDANCE
    # ────────────────────────────────────────────────────────────────────────
    print("🎪  Seeding events & attendance (FR-15, FR-16) …")

    event_data = [
        ("Tech Symposium 2026",      "Annual technology showcase with industry speakers and student project demos.",  date(2026, 5, 10), 150),
        ("AI & ML Workshop",         "Hands-on workshop covering machine learning basics and model deployment.",       date(2026, 5, 17), 60),
        ("Career Fair Spring 2026",  "On-campus recruitment drive with 20+ companies.",                               date(2026, 5, 25), 300),
        ("Softcom 2026",             "Inter-university software competition organized by FAST-NUCES.",                 date(2026, 4, 20), 100),
        ("Python Bootcamp",          "3-day intensive Python programming bootcamp for beginners.",                     date(2026, 4, 5),  40),
    ]
    events = []
    for (title, desc, edate, cap) in event_data:
        e = Event.query.filter_by(title=title).first()
        if not e:
            e = Event(title=title, description=desc, event_date=edate, capacity=cap)
            db.session.add(e)
            db.session.flush()
        events.append(e)
    db.session.commit()

    # Registrations & attendance
    reg_plan = [
        # (event_idx, [student_list], attendance_status)
        (0, students[:8],  "attended"),   # Tech Symposium — past-ish, mark attended
        (1, students[:5],  "attended"),   # AI Workshop
        (2, students,      "registered"), # Career Fair — upcoming
        (3, students[2:8], "attended"),   # Softcom — past
        (4, students[1:5], "attended"),   # Python Bootcamp — past
    ]
    for (eidx, stud_list, att_status) in reg_plan:
        ev = events[eidx]
        for stud in stud_list:
            exists = EventRegistration.query.filter_by(event_id=ev.id, user_id=stud.id).first()
            if not exists:
                db.session.add(EventRegistration(
                    event_id=ev.id,
                    user_id=stud.id,
                    attendance_status=att_status,
                    registered_at=ts(10)
                ))
    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  FR-17  ANNOUNCEMENTS
    # ────────────────────────────────────────────────────────────────────────
    print("📢  Seeding announcements (FR-17) …")

    ann_data = [
        ("Mid-Term Exam Schedule Released",
         "Mid-term examinations for Spring 2026 will be held from May 12–16. Detailed schedule available on the SUMIS portal.",
         "academic"),
        ("University Closed on 1st May",
         "University will remain closed on Thursday 1st May 2026 in observance of Labour Day.",
         "general"),
        ("SUMIS Portal Maintenance",
         "SUMIS will undergo scheduled maintenance on Sunday 4th May from 2 AM to 5 AM. Please plan accordingly.",
         "general"),
        ("HEC Scholarship Applications Open",
         "HEC Need-Based Scholarship applications for Spring 2026 are now open. Submit via Registrar before May 20.",
         "financial"),
        ("Anti-Plagiarism Policy Reminder",
         "All final project reports must pass Turnitin with less than 20% similarity. Submissions with higher similarity will be rejected.",
         "academic"),
        ("Career Fair Registration Now Open",
         "Students wishing to attend the Spring 2026 Career Fair must register on SUMIS Events by May 22. Limited seats available.",
         "event"),
        ("Fee Due Date Reminder — Spring 2026",
         "Last date to pay Spring 2026 semester fee without fine is May 10. Late payments will incur Rs. 500 per day fine.",
         "financial"),
        ("Convocation 2025 Date Announced",
         "Convocation ceremony for batch 2025 graduates will be held on June 15, 2026. Invitations will be issued via email.",
         "event"),
        ("New Library Timing",
         "Library timings have been updated to 8 AM – 9 PM Monday through Saturday effective immediately.",
         "general"),
        ("FYP Poster Submission Deadline",
         "Final Year Project poster files must be submitted to the CS Department by May 8. Softcopy in A1 PDF format.",
         "academic"),
    ]
    for (title, msg, cat) in ann_data:
        exists = Announcement.query.filter_by(title=title, content_type="announcement").first()
        if not exists:
            db.session.add(Announcement(
                title=title, message=msg,
                content_type="announcement", category=cat,
                created_by=adm.id, is_active=True,
                created_at=ts(5)
            ))
    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  FR-18  NOTIFICATIONS (department-targeted, per-user)
    # ────────────────────────────────────────────────────────────────────────
    print("🔔  Seeding notifications (FR-18) …")

    notif_data = [
        (s1,  "Your Transcript request has been approved. Please collect from Registrar Office.",         False, 15),
        (s1,  "Your NOC Letter is ready. Collect from CS Department office.",                             True,  13),
        (s2,  "Your service request for NOC Letter has been approved.",                                   True,  14),
        (s3,  "Your Enrollment Certificate request is approved. Certificate is ready for collection.",    False, 11),
        (s4,  "Your Fee Challan Reissue request is currently in progress.",                               False,  7),
        (s5,  "Your Course Withdrawal request has been approved. Grade will appear as W on transcript.",  False,  8),
        (s6,  "Your Lab Access Extension request has been received and is under review.",                 True,   4),
        (s7,  "Your Library Fine Clearance has been processed. Your library account is now clear.",       True,  22),
        (s8,  "Your Migration Certificate request has been rejected. Please clear dues first.",           False,  9),
        (s9,  "Your Degree Verification letter has been approved and is ready.",                          False,  5),
        (s10, "Your Scholarship Verification request has been received. Expected completion: 3 days.",    False,  2),
        (s1,  "WiFi issue you reported has been resolved. Please verify connectivity.",                   True,  12),
        (s4,  "Your complaint regarding the fee portal has been resolved by IT team.",                    True,   4),
        (s5,  "Your grade correction complaint is under review by Academic Affairs.",                     False,  3),
        (s7,  "Duplicate fee charge complaint is being investigated by Accounts Office.",                 False,  5),
        (s3,  "Your complaint about the hostel washroom has been assigned to Hostel Management.",         False,  6),
        (s9,  "Transport complaint registered. Maintenance team has been notified.",                      False,  1),
        (s10, "Library fine dispute resolved. Your account has been updated.",                            True,  14),
        # Coordinator & faculty notifications
        (crd, "Tech Symposium 2026 now has 8 confirmed registrations. Venue setup reminder.",             False,  2),
        (f1,  "You have 3 upcoming student appointments this week. Please confirm availability.",         False,  1),
    ]
    for (user, msg, is_read, days) in notif_data:
        db.session.add(Notification(
            user_id=user.id,
            message=msg,
            is_read=is_read,
            created_at=ts(days)
        ))
    db.session.commit()

    # ────────────────────────────────────────────────────────────────────────
    #  FR-19 / FR-20  SUMMARY
    # ────────────────────────────────────────────────────────────────────────
    print("\n📊  FR-19 / FR-20 Data Summary (live queries):")

    total_req  = ServiceRequest.query.count()
    completed  = ServiceRequest.query.filter_by(status="completed").count()
    pending    = ServiceRequest.query.filter_by(status="pending").count()
    in_prog    = ServiceRequest.query.filter_by(status="in_progress").count()
    approved   = ServiceRequest.query.filter_by(status="approved").count()
    rejected   = ServiceRequest.query.filter_by(status="rejected").count()

    total_comp = ComplaintV2.query.count()
    c_resolved = ComplaintV2.query.filter_by(status="Resolved").count()
    c_inprog   = ComplaintV2.query.filter_by(status="In Progress").count()
    c_pending  = ComplaintV2.query.filter_by(status="Pending").count()

    print(f"  Service Requests : {total_req} total | {completed} completed | {approved} approved | {in_prog} in-progress | {pending} pending | {rejected} rejected")
    print(f"  Complaints       : {total_comp} total | {c_resolved} resolved ({round(c_resolved/total_comp*100)}%) | {c_inprog} in-progress | {c_pending} pending")
    print(f"  Appointments     : {Appointment.query.count()} total")
    print(f"  Events           : {Event.query.count()} total | {EventRegistration.query.count()} registrations")
    print(f"  Announcements    : {Announcement.query.filter_by(content_type='announcement').count()} public | {Announcement.query.filter_by(content_type='procedure').count()} procedures | {Announcement.query.filter_by(content_type='location').count()} locations")
    print(f"  Notifications    : {Notification.query.count()} total | {Notification.query.filter_by(is_read=False).count()} unread")
    print(f"  Users            : {User.query.count()} total")

    print("\n✅  All FR-01 → FR-20 dummy data seeded successfully.")