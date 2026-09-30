"""Follow-up engine + SIMULATED SMS. Owner: backend person.
For the demo, 'sending' = marking sent and returning text for the phone mockup.
Real SMS (Twilio) is a stretch goal."""
from datetime import datetime, timedelta, timezone
from . import db


def schedule(case_id: int, delay_minutes: int, message: str, channel: str = "sms") -> None:
    due = (datetime.now(timezone.utc) + timedelta(minutes=delay_minutes)).isoformat(timespec="seconds")
    with db.conn() as c:
        c.execute("INSERT INTO followups (case_id, due_at, channel, message) VALUES (?,?,?,?)",
                  (case_id, due, channel, message))
    db.update_case(case_id, status="pending_followup")


def list_all() -> list[dict]:
    with db.conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM followups ORDER BY id DESC")]


def fire_now(followup_id: int) -> dict:
    """Demo button: pretend time passed, 'send' the SMS."""
    with db.conn() as c:
        c.execute("UPDATE followups SET sent=1 WHERE id=?", (followup_id,))
        return dict(c.execute("SELECT * FROM followups WHERE id=?", (followup_id,)).fetchone())


def recover(case_id: int, value_aud: float) -> None:
    """Caller booked after the follow-up: mark recovered revenue."""
    db.update_case(case_id, status="recovered", value_aud=value_aud)
