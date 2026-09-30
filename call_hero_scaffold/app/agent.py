"""The front-desk agent. Owner: conversation person.
Config JSON -> system prompt. Claude uses tools; tools write to the case."""
import os, json
from dotenv import load_dotenv
from . import db, mock_pms, followups

load_dotenv()
AGENT_MODEL = os.getenv("AGENT_MODEL", "claude-haiku-4-5-20251001")

TOOLS = [
    {"name": "check_slots", "description": "List available appointment slots for a service.",
     "input_schema": {"type": "object", "properties": {"service": {"type": "string"}}, "required": ["service"]}},
    {"name": "book_appointment", "description": "Book a slot once caller confirms name and slot.",
     "input_schema": {"type": "object", "properties": {
         "slot_id": {"type": "string"}, "service": {"type": "string"}, "name": {"type": "string"}},
         "required": ["slot_id", "service", "name"]}},
    {"name": "escalate_to_human", "description": "Hand off to staff for emergencies, distress, complaints.",
     "input_schema": {"type": "object", "properties": {"reason": {"type": "string"}}, "required": ["reason"]}},
    {"name": "schedule_followup", "description": "Use when caller hesitates or leaves without booking. "
     "Record why in reason_not_booked (e.g. 'price', 'wants to think', 'needs time off').",
     "input_schema": {"type": "object", "properties": {
         "caller_name": {"type": "string"}, "reason_not_booked": {"type": "string"},
         "estimated_value_aud": {"type": "number"}}, "required": ["reason_not_booked"]}},
]


def build_system_prompt(cfg: dict) -> str:
    services = "\n".join(f"- {s['name']} ({s['duration_min']} min"
                         + (f", ${s['price_aud']:.0f}" if s.get("price_aud") and s.get("quote_price_on_phone") else "")
                         + ")" for s in cfg["services"])
    return f"""You are the front desk for {cfg['business_name']} ({cfg['vertical']}). Tone: {cfg['tone']}.
Hours: {cfg['open_hours']}. Reply in the caller's language. Keep replies short: this is a phone call.

Services:
{services}

Goals: answer routine questions, guide the caller to a booking, capture name. If they hesitate or leave
without booking, call schedule_followup with the reason. Never invent prices or availability: use tools.

ESCALATE immediately (escalate_to_human) if the caller mentions: {', '.join(cfg['escalation_triggers']) or 'an emergency'}.
Say: "{cfg['escalation_message']}"
NEVER: {', '.join(cfg['never_do']) or 'give medical advice'}."""


def _run_tool(name: str, args: dict, case: dict, cfg: dict) -> dict:
    cid = case["id"]
    if name == "check_slots":
        return {"slots": mock_pms.check_slots(args["service"])}
    if name == "book_appointment":
        r = mock_pms.book(cid, args["slot_id"], args["service"], args["name"])
        db.update_case(cid, status="booked", caller_name=args["name"], intent=args["service"])
        return r
    if name == "escalate_to_human":
        db.update_case(cid, status="needs_human", reason_not_booked=args["reason"])
        return {"escalated": True}
    if name == "schedule_followup":
        db.update_case(cid, caller_name=args.get("caller_name"),
                       reason_not_booked=args["reason_not_booked"],
                       value_aud=args.get("estimated_value_aud", 0))
        rule = (cfg.get("followups") or [{"delay_minutes": 10, "message": "Hi {name}, ready to book? {link}"}])[0]
        msg = rule["message"].format(name=args.get("caller_name") or "there", link="https://book.example/abc")
        followups.schedule(cid, rule["delay_minutes"], msg)
        return {"followup_scheduled": True}
    return {"error": "unknown tool"}


def _offline_reply(cfg: dict, user_msg: str) -> str:
    """Used when ANTHROPIC_API_KEY is missing so the UI still works."""
    return f"[offline mode: no API key] Thanks for calling {cfg['business_name']}. You said: {user_msg}"


def respond(session_id: str, user_msg: str, phone: str | None = None) -> tuple[str, dict]:
    cfg = db.load_config()
    if not cfg:
        raise ValueError("No config saved yet. POST /api/config first.")
    case = db.get_or_create_case(session_id, phone)
    db.add_message(case["id"], "user", user_msg)

    if not os.getenv("ANTHROPIC_API_KEY"):
        reply = _offline_reply(cfg, user_msg)
        db.add_message(case["id"], "assistant", reply)
        return reply, db.get_case(case["id"])

    import anthropic
    client = anthropic.Anthropic()
    messages = db.get_messages(case["id"])
    system = build_system_prompt(cfg)
    reply = ""
    for _ in range(5):  # tool loop
        resp = client.messages.create(model=AGENT_MODEL, max_tokens=500, system=system,
                                      tools=TOOLS, messages=messages)
        if resp.stop_reason != "tool_use":
            reply = "".join(b.text for b in resp.content if b.type == "text")
            break
        messages.append({"role": "assistant", "content": [b.model_dump() for b in resp.content]})
        results = []
        for b in resp.content:
            if b.type == "tool_use":
                out = _run_tool(b.name, b.input, case, cfg)
                results.append({"type": "tool_result", "tool_use_id": b.id, "content": json.dumps(out)})
        messages.append({"role": "user", "content": results})
    db.add_message(case["id"], "assistant", reply)
    return reply, db.get_case(case["id"])
