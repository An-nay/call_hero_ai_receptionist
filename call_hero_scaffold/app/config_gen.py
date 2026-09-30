"""Plain-English -> FrontDeskConfig. Owner: config-studio person."""
import os, json, glob
from dotenv import load_dotenv
from .schema import FrontDeskConfig

load_dotenv()
CONFIG_MODEL = os.getenv("CONFIG_MODEL", "claude-sonnet-5-5")
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "templates")


def list_templates() -> list[str]:
    return sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(TEMPLATE_DIR, "*.json")))


def load_template(name: str) -> dict:
    with open(os.path.join(TEMPLATE_DIR, f"{name}.json")) as f:
        return json.load(f)


def generate(description: str, base_template: str = "dental") -> dict:
    """Ask Claude to adapt a template to the owner's description. Falls back to the template."""
    base = load_template(base_template)
    if not os.getenv("ANTHROPIC_API_KEY"):
        return base
    import anthropic
    client = anthropic.Anthropic()
    prompt = (f"Owner description: {description}\n\nStarting template JSON:\n{json.dumps(base)}\n\n"
              "Return ONLY valid JSON matching the template's shape, adapted to the owner's business. "
              "Keep escalation triggers safe for the vertical. No markdown fences.")
    r = client.messages.create(model=CONFIG_MODEL, max_tokens=2000,
                               messages=[{"role": "user", "content": prompt}])
    text = "".join(b.text for b in r.content if b.type == "text").replace("```json", "").replace("```", "").strip()
    try:
        return FrontDeskConfig(**json.loads(text)).model_dump()
    except Exception:
        return base  # never break the demo
