"""SHARED CONTRACT. Change this file only after telling the team.
Everything (agent, config generator, dashboard, follow-ups) speaks these types."""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field

CaseStatus = Literal["open", "booked", "answered", "needs_human", "pending_followup", "recovered", "lost"]


class Service(BaseModel):
    name: str
    duration_min: int = 30
    price_aud: Optional[float] = None
    quote_price_on_phone: bool = True


class FollowUpRule(BaseModel):
    delay_minutes: int
    channel: Literal["sms", "email"] = "sms"
    message: str  # may contain {name} and {link}


class FrontDeskConfig(BaseModel):
    business_name: str
    vertical: str  # dental | psychology | beauty | gp | ...
    tone: str = "warm, concise, Australian"
    open_hours: str = "Mon-Fri 8:00-17:00"
    services: list[Service] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=lambda: ["English"])
    escalation_triggers: list[str] = Field(default_factory=list)  # e.g. "severe pain", "suicidal"
    escalation_message: str = "I'm connecting you with a member of our team right away."
    followups: list[FollowUpRule] = Field(default_factory=list)
    never_do: list[str] = Field(default_factory=list)  # e.g. "give medical advice"


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class Case(BaseModel):
    id: int
    session_id: str
    caller_name: Optional[str] = None
    caller_phone: Optional[str] = None
    intent: Optional[str] = None
    status: CaseStatus = "open"
    reason_not_booked: Optional[str] = None
    value_aud: float = 0.0
    language: str = "English"
    created_at: str = ""


class FollowUp(BaseModel):
    id: int
    case_id: int
    due_at: str
    channel: str
    message: str
    sent: bool = False


class ChatRequest(BaseModel):
    session_id: str
    message: str
    caller_phone: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    case_id: int
    status: CaseStatus
