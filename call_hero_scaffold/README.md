# Front Desk Studio
*Call Hero Hackathon, 30 Sep 2026. Brief: "Build your own front desk."*

A front desk you configure in plain English, where every enquiry becomes a tracked case that never dies quietly.

**Build** (pick a template or describe the business) -> **Run** (agent answers, books, escalates) -> **Recover** (auto follow-up when a caller doesn't book) -> **Learn** (dashboard: recovered revenue, why people didn't book).

## Run it
```bash
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # add ANTHROPIC_API_KEY
uvicorn app.main:app --reload                          # open http://localhost:8000
pytest                                                 # smoke test
```
Without an API key the app runs in offline mode (templates work, agent replies with a stub), so the UI is never blocked.

## Structure and owners
| Path | What | Owner |
|---|---|---|
| `app/schema.py` | Shared types. **The contract. Tell the team before changing.** | everyone |
| `app/agent.py` | System prompt, tools, tool loop | Conversation |
| `app/config_gen.py`, `data/templates/` | Sentence -> config, vertical templates | Config studio |
| `app/db.py`, `app/mock_pms.py`, `app/followups.py` | Storage, fake Cliniko calendar, follow-up + simulated SMS | Backend |
| `app/insights.py`, `static/index.html` | Dashboard numbers, UI (placeholder, replace it) | Front end / pitch |
| `app/main.py` | API routes | Backend |

## API
`GET /api/templates` `POST /api/config/generate` `GET|POST /api/config` `POST /api/chat`
`GET /api/cases` `GET /api/followups` `POST /api/followups/{id}/fire` `POST /api/cases/{id}/recover`
`GET /api/insights` `POST /api/reset`

## Git rules
1. Branch per person: `feat/agent`, `feat/config`, `feat/backend`, `feat/ui`. Never work directly on `main`.
2. Small commits, pull `main` often, merge at checkpoints: **11:30, 13:00, 14:30, 15:15**.
3. `.env` is never committed. Share the API key privately.
4. `main` must always run. Test before merging.

## Demo script (3 min)
1. Build a dental front desk in 60 seconds. 2. After-hours caller asks the price, hesitates, leaves.
3. Follow-up SMS fires, caller books. 4. Dashboard shows the recovered revenue.
5. Second call: "severe pain and swelling" -> escalates to a human. 6. Bonus: caller in Mandarin or Vietnamese.

## Cut line (if behind)
Keep: configurator, one call-to-recovered-booking story, dashboard. Drop or fake first: real voice, real SMS, real PMS.

## Known considerations (say these in the pitch)
Australian Privacy Act and call-recording consent, safe escalation in health settings, and human handoff over AI confidence.
