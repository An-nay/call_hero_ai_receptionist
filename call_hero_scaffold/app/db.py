"""SQLite storage. Owner: backend person. Simple on purpose."""
import os, sqlite3, json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()
DB_PATH = os.getenv("DB_PATH", "frontdesk.db")


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    with conn() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY CHECK (id=1), json TEXT);
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT UNIQUE, caller_name TEXT,
            caller_phone TEXT, intent TEXT, status TEXT DEFAULT 'open', reason_not_booked TEXT,
            value_aud REAL DEFAULT 0, language TEXT DEFAULT 'English', created_at TEXT);
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER, role TEXT, content TEXT);
        CREATE TABLE IF NOT EXISTS followups (
            id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER, due_at TEXT,
            channel TEXT, message TEXT, sent INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER, slot TEXT, service TEXT, name TEXT);
        """)


def save_config(cfg: dict) -> None:
    with conn() as c:
        c.execute("INSERT OR REPLACE INTO config (id, json) VALUES (1, ?)", (json.dumps(cfg),))


def load_config() -> dict | None:
    with conn() as c:
        r = c.execute("SELECT json FROM config WHERE id=1").fetchone()
    return json.loads(r["json"]) if r else None


def get_or_create_case(session_id: str, phone: str | None = None) -> dict:
    with conn() as c:
        r = c.execute("SELECT * FROM cases WHERE session_id=?", (session_id,)).fetchone()
        if not r:
            c.execute("INSERT INTO cases (session_id, caller_phone, created_at) VALUES (?,?,?)",
                      (session_id, phone, now()))
            r = c.execute("SELECT * FROM cases WHERE session_id=?", (session_id,)).fetchone()
    return dict(r)


def update_case(case_id: int, **fields) -> None:
    if not fields:
        return
    cols = ", ".join(f"{k}=?" for k in fields)
    with conn() as c:
        c.execute(f"UPDATE cases SET {cols} WHERE id=?", (*fields.values(), case_id))


def get_case(case_id: int) -> dict:
    with conn() as c:
        return dict(c.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone())


def add_message(case_id: int, role: str, content: str) -> None:
    with conn() as c:
        c.execute("INSERT INTO messages (case_id, role, content) VALUES (?,?,?)", (case_id, role, content))


def get_messages(case_id: int) -> list[dict]:
    with conn() as c:
        rows = c.execute("SELECT role, content FROM messages WHERE case_id=? ORDER BY id", (case_id,)).fetchall()
    return [dict(r) for r in rows]


def list_cases() -> list[dict]:
    with conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM cases ORDER BY id DESC")]
