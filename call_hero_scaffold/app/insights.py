"""Dashboard numbers + 'insight of the week'. Owner: dashboard person."""
from collections import Counter
from . import db


def summary() -> dict:
    cases = db.list_cases()
    by_status = Counter(c["status"] for c in cases)
    reasons = Counter(c["reason_not_booked"] for c in cases if c["reason_not_booked"])
    return {
        "total_cases": len(cases),
        "by_status": dict(by_status),
        "booked": by_status["booked"] + by_status["recovered"],
        "recovered": by_status["recovered"],
        "recovered_revenue_aud": sum(c["value_aud"] for c in cases if c["status"] == "recovered"),
        "needs_human": by_status["needs_human"],
        "top_reasons_not_booked": reasons.most_common(5),
    }
