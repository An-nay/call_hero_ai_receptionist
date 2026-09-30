"""Fake Cliniko/HotDoc-style practice management system. Owner: backend person.
Swap for a real adapter later; the agent only sees these two functions."""
from datetime import datetime, timedelta
from . import db


def check_slots(service: str, days_ahead: int = 3) -> list[dict]:
    """Return up to 6 fake open slots, skipping any already booked."""
    with db.conn() as c:
        taken = {r["slot"] for r in c.execute("SELECT slot FROM bookings")}
    slots, d = [], datetime.now().replace(minute=0, second=0, microsecond=0)
    while len(slots) < 6:
        d += timedelta(hours=1)
        if d.weekday() < 5 and 9 <= d.hour <= 16 and d > datetime.now() + timedelta(hours=12):
            label = d.strftime("%a %d %b %I:%M%p")
            if label not in taken:
                slots.append({"slot_id": label, "service": service})
    return slots


def book(case_id: int, slot_id: str, service: str, name: str) -> dict:
    with db.conn() as c:
        c.execute("INSERT INTO bookings (case_id, slot, service, name) VALUES (?,?,?,?)",
                  (case_id, slot_id, service, name))
    return {"confirmed": True, "slot": slot_id, "service": service, "name": name}
