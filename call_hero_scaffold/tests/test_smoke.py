import os
os.environ["DB_PATH"] = "test_frontdesk.db"
os.environ.pop("ANTHROPIC_API_KEY", None)
from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)


def test_flow_offline():
    cfg = c.post("/api/config/generate", json={"description": "dental clinic", "template": "dental"}).json()
    assert c.post("/api/config", json=cfg).json()["saved"]
    r = c.post("/api/chat", json={"session_id": "s1", "message": "hi, price of a check-up?"}).json()
    assert r["case_id"] and r["status"] == "open"
    assert "total_cases" in c.get("/api/insights").json()
