from app.models.announcement import Announcement
from app.models import db
from datetime import datetime

PROCEDURES = [
    {
        "title": "Transcript Request (Official / Unofficial)",
        "message": "Step-by-step guide to request official or unofficial transcripts from the Registrar's office. Processing takes 3–5 working days for unofficial and 7–10 for official sealed copies.",
        "category": "academic",
        "estimated_duration": "3–10 working days",
        "steps": [
            {"step_number": 1, "title": "Log in to SUMIS",          "description": "Visit sumis.nu.edu.pk and sign in with your student credentials.", "note": "Use Chrome or Firefox."},
            {"step_number": 2, "title": "Go to Service Requests",   "description": "Select Services → Academic Documents → Transcript Request.", "note": None},
            {"step_number": 3, "title": "Fill the Request Form",    "description": "Choose transcript type (official/unofficial), number of copies, and purpose.", "note": "Official transcripts must be addressed to a specific institution."},
            {"step_number": 4, "title": "Pay Processing Fee",       "description": "Pay PKR 200 (unofficial) or PKR 500 (official) via the payment portal and upload receipt.", "note": None},
            {"step_number": 5, "title": "Submit & Note Reference",  "description": "Click Submit and save your reference number (TRQ-YYYYMMDD-####).", "note": None},
            {"step_number": 6, "title": "Track Status",             "description": "Monitor progress under My Requests. You will be notified when ready for collection.", "note": None},
        ],
    },
    {
        "title": "Course Withdrawal",
        "message": "Guide for students who need to withdraw from a course within the semester deadline. A 'W' grade is recorded and does not affect GPA.",
        "category": "academic",
        "estimated_duration": "2–3 working days",
        "steps": [
            {"step_number": 1, "title": "Check Withdrawal Deadline", "description": "Verify you are within the withdrawal window from the Academic Calendar.", "note": "Late requests require special approval."},
            {"step_number": 2, "title": "Consult Your Advisor",      "description": "Schedule an appointment via SUMIS to discuss the academic impact.", "note": None},
            {"step_number": 3, "title": "Submit Withdrawal Request", "description": "Go to Services → Academic → Course Withdrawal, select the course and state your reason.", "note": None},
            {"step_number": 4, "title": "Department Approval",       "description": "Request is auto-routed to the instructor then Department Head for approval.", "note": "You remain enrolled until both approvals are received."},
            {"step_number": 5, "title": "Registrar Processing",      "description": "Once approved, the Registrar updates your enrollment record with a 'W' grade.", "note": None},
            {"step_number": 6, "title": "Fee Refund (if applicable)","description": "Submit a fee refund request under Services → Financial if within the refund window.", "note": "Refunds processed in 10–15 working days."},
        ],
    },
    {
        "title": "Semester Freeze / Leave of Absence",
        "message": "A semester freeze allows enrolled students to defer studies for one semester without academic penalty. Maximum two freezes are allowed across the entire degree.",
        "category": "registration",
        "estimated_duration": "5–7 working days",
        "steps": [
            {"step_number": 1, "title": "Obtain Supporting Documents",        "description": "Gather a medical certificate or personal letter explaining the reason.", "note": None},
            {"step_number": 2, "title": "Submit Freeze Application",          "description": "Go to Services → Registration → Semester Freeze and attach scanned documents.", "note": None},
            {"step_number": 3, "title": "Advisor Recommendation",             "description": "Your advisor reviews the application and provides a written recommendation.", "note": None},
            {"step_number": 4, "title": "Department Head & Dean Approval",    "description": "Both approve sequentially — this typically takes 3–5 working days.", "note": None},
            {"step_number": 5, "title": "Fee Adjustment",                     "description": "Finance department processes any applicable fee adjustments.", "note": None},
            {"step_number": 6, "title": "Re-enrollment Reminder",             "description": "SUMIS sends a reminder two weeks before the next semester to re-enroll.", "note": None},
        ],
    },
    {
        "title": "Student ID Card Replacement",
        "message": "Report a lost, stolen, or damaged NUCES ID card and collect the replacement from the IT office within 3 working days.",
        "category": "it_services",
        "estimated_duration": "3 working days",
        "steps": [
            {"step_number": 1, "title": "Report Loss or Damage",   "description": "Go to Services → IT Services → ID Card Replacement and select the reason.", "note": "For stolen cards, attach a copy of the FIR."},
            {"step_number": 2, "title": "Pay Replacement Fee",     "description": "Pay PKR 300 via the payment portal and upload the receipt.", "note": None},
            {"step_number": 3, "title": "Upload Photograph",       "description": "Upload a passport-size photo (JPEG/PNG, white background, min 300×400 px).", "note": None},
            {"step_number": 4, "title": "IT Department Processing","description": "IT prints and activates your new card. SUMIS notifies you when ready.", "note": None},
            {"step_number": 5, "title": "Collect from IT Office",  "description": "Visit IT Office, Block A Room 102 with your SUMIS approval notification.", "note": "Office hours: Mon–Fri, 9:00 AM – 4:00 PM."},
        ],
    },
    {
        "title": "Fee Deferral Request",
        "message": "Students facing financial hardship may apply for a partial or full deferral of semester fee payment. Only one deferral is permitted per academic year.",
        "category": "financial",
        "estimated_duration": "5–7 working days",
        "steps": [
            {"step_number": 1, "title": "Check Eligibility",          "description": "Confirm you have not used a deferral this academic year and the fee deadline has not passed.", "note": None},
            {"step_number": 2, "title": "Prepare Financial Evidence", "description": "Gather bank statement, salary slip, or hardship affidavit dated within last 30 days.", "note": None},
            {"step_number": 3, "title": "Submit Application",         "description": "Go to Services → Financial → Fee Deferral Request and upload documents.", "note": None},
            {"step_number": 4, "title": "Finance Committee Review",   "description": "The Finance office reviews and may request a brief interview.", "note": None},
            {"step_number": 5, "title": "Decision Notification",      "description": "You will receive the decision on SUMIS with your new payment deadline if approved.", "note": "Further extensions are not available."},
        ],
    },
]


def seed(admin_user_id=1):
    inserted = 0
    skipped  = 0
    for data in PROCEDURES:
        existing = Announcement.query.filter_by(
            title=data["title"], content_type="procedure"
        ).first()
        if existing:
            print(f"  [SKIP]   '{data['title']}'")
            skipped += 1
            continue
        proc = Announcement(
            title              = data["title"],
            message            = data["message"],
            content_type       = "procedure",
            category           = data["category"],
            steps              = data["steps"],
            estimated_duration = data.get("estimated_duration"),
            created_by         = admin_user_id,
            is_active          = True,
            created_at         = datetime.utcnow(),
        )
        db.session.add(proc)
        print(f"  [INSERT] '{data['title']}'")
        inserted += 1
    db.session.commit()
    print(f"\nDone — {inserted} inserted, {skipped} skipped.")