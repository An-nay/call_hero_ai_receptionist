"""API entrypoint. Run: uvicorn app.main:app --reload"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from . import db, agent, config_gen, followups, insights
from .schema import FrontDeskConfig, ChatRequest, ChatResponse

app = FastAPI(title="Front Desk Studio")
db.init_db()


class GenerateRequest(BaseModel):
    description: str
    template: str = "dental"


@app.get("/api/templates")
def templates():
    return config_gen.list_templates()


@app.post("/api/config/generate")
def generate_config(req: GenerateRequest):
    return config_gen.generate(req.description, req.template)


@app.get("/api/config")
def get_config():
    return db.load_config() or {}


@app.post("/api/config")
def save_config(cfg: FrontDeskConfig):
    db.save_config(cfg.model_dump())
    return {"saved": True}


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        reply, case = agent.respond(req.session_id, req.message, req.caller_phone)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return ChatResponse(reply=reply, case_id=case["id"], status=case["status"])


@app.get("/api/cases")
def cases():
    return db.list_cases()


@app.get("/api/followups")
def get_followups():
    return followups.list_all()


@app.post("/api/followups/{fid}/fire")
def fire(fid: int):
    return followups.fire_now(fid)


@app.post("/api/cases/{case_id}/recover")
def recover(case_id: int, value_aud: float = 220):
    followups.recover(case_id, value_aud)
    return db.get_case(case_id)


@app.get("/api/insights")
def get_insights():
    return insights.summary()


@app.post("/api/reset")
def reset():
    """Demo helper: wipe cases so you can re-run the story."""
    with db.conn() as c:
        for t in ("cases", "messages", "followups", "bookings"):
            c.execute(f"DELETE FROM {t}")
    return {"reset": True}


static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def index():
    return FileResponse(os.path.join(static_dir, "index.html"))
