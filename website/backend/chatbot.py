"""Vedyam chatbot. Uses Google Gemini when GEMINI_API_KEY is set, otherwise a
graceful offline fallback so the product always responds."""
import json
import urllib.request
import urllib.error

from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_BASE_URL

SYSTEM = (
    "You are Vedyam, a warm, grounded guide to Indian wisdom (Vedas, Upanishads, "
    "Bhagavad Gita, yoga and Vedic psychology). You make timeless ideas practical "
    "for modern life: clarity, discipline and purpose (dharma). Be concise, kind and "
    "concrete. Avoid dogma; never give medical or legal advice. When you cite a "
    "concept, briefly explain it in plain language with a modern example."
)
TEACH_SUFFIX = (
    " TEACH MODE is ON: structure your answer as a tiny lesson \u2014 a one-line idea, "
    "a short explanation, a modern example, and one small action to try today."
)


def _fallback(message: str, teach_mode: bool) -> str:
    m = (message or "").lower()
    if "gita" in m or "bhagavad" in m:
        body = (
            "The Bhagavad Gita is a 700-verse conversation on the battlefield of "
            "Kurukshetra, where Krishna counsels Arjuna, who is paralysed by doubt. "
            "Its core idea: act with full sincerity, but release your grip on the "
            "outcome (nishkama karma). In modern terms \u2014 do the work, drop the anxiety "
            "about results."
        )
    elif "relevan" in m or "why" in m:
        body = (
            "Indian wisdom stays relevant because it studies the one thing that never "
            "goes out of date: the human mind. Frameworks for attention, desire, habit "
            "and purpose map almost perfectly onto modern psychology \u2014 they just got "
            "there a few thousand years earlier."
        )
    elif "concept" in m or "teach" in m or "important" in m:
        body = (
            "Three concepts to begin with: (1) Dharma \u2014 your right action / purpose; "
            "(2) Karma \u2014 action and its echoes; (3) the three gunas \u2014 sattva (clarity), "
            "rajas (restlessness), tamas (inertia). Noticing which guna is driving you "
            "right now is a powerful daily practice."
        )
    else:
        body = (
            "That's a thoughtful question. Vedic thought would invite you to slow down, "
            "observe the mind without judgement, and choose the next right action. Tell "
            "me a little more about your situation and I'll point you to a relevant "
            "framework or course."
        )
    if teach_mode:
        body += "\n\nTry today: take three slow breaths before your next decision and ask, \u2018what is the right action here, regardless of reward?\u2019"
    return body + "\n\n(Vedyam is in offline demo mode \u2014 add a GEMINI_API_KEY for live, personalised guidance.)"


def _call_gemini(message: str, history, teach_mode: bool) -> str:
    url = f"{GEMINI_BASE_URL}/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    contents = []
    for h in (history or [])[-8:]:
        role = "user" if h.get("role") == "user" else "model"
        text = h.get("text", "")
        if text:
            contents.append({"role": role, "parts": [{"text": text}]})
    contents.append({"role": "user", "parts": [{"text": message}]})
    sys_text = SYSTEM + (TEACH_SUFFIX if teach_mode else "")
    payload = {
        "system_instruction": {"parts": [{"text": sys_text}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 800},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result["candidates"][0]["content"]["parts"][0]["text"].strip()


def get_reply(message: str, history=None, teach_mode: bool = False) -> str:
    if not message or not message.strip():
        return "Ask me anything about Indian wisdom \u2014 the Gita, dharma, focus, or how to begin."
    if not GEMINI_API_KEY:
        return _fallback(message, teach_mode)
    try:
        return _call_gemini(message, history, teach_mode)
    except Exception:
        return _fallback(message, teach_mode)
