"""Vedyam chatbot. Uses Groq for live responses, otherwise a
graceful offline fallback so the product always responds."""
import json
import os
import urllib.request
import urllib.error
from groq import Groq

from config import GEMINI_MODEL, GEMINI_BASE_URL

SYSTEM = (
    "You are Vedyam, a warm, grounded guide to Indian wisdom (Vedas, Upanishads, "
    "Bhagavad Gita, yoga and Vedic psychology). You make timeless ideas practical "
    "for modern life: clarity, discipline and purpose (dharma). Be concise, kind and "
    "concrete. Avoid dogma; never give medical or legal advice. When you cite a "
    "concept, briefly explain it in plain language with a modern example."
)
TEACH_SUFFIX = (
    " TEACH MODE is ON: structure your answer as a tiny lesson — a one-line idea, "
    "a short explanation, a modern example, and one small action to try today."
)

def _fallback(message: str, teach_mode: bool) -> str:
    m = (message or "").lower()
    if "gita" in m or "bhagavad" in m:
        body = (
            "The Bhagavad Gita is a 700-verse conversation on the battlefield of "
            "Kurukshetra, where Krishna counsels Arjuna, who is paralysed by doubt. "
            "Its core idea: act with full sincerity, but release your grip on the "
            "outcome (nishkama karma). In modern terms — do the work, drop the anxiety "
            "about results."
        )
    elif "relevan" in m or "why" in m:
        body = (
            "Indian wisdom stays relevant because it studies the one thing that never "
            "goes out of date: the human mind. Frameworks for attention, desire, habit "
            "and purpose map almost perfectly onto modern psychology — they just got "
            "there a few thousand years earlier."
        )
    elif "concept" in m or "teach" in m or "important" in m:
        body = (
            "Three concepts to begin with: (1) Dharma — your right action / purpose; "
            "(2) Karma — action and its echoes; (3) the three gunas — sattva (clarity), "
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
        body += "\n\nTry today: take three slow breaths before your next decision and ask, 'what is the right action here, regardless of reward?'"
    return body + "\n\n(Vedyam is in offline demo mode — add a GROQ_API_KEY in backend/.env for live, personalised guidance.)"

def _call_groq(message: str, history, teach_mode: bool) -> str:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return _fallback(message, teach_mode)
        
    client = Groq(api_key=api_key)
    
    messages = []
    sys_text = SYSTEM + (TEACH_SUFFIX if teach_mode else "")
    messages.append({"role": "system", "content": sys_text})
    
    for h in (history or [])[-8:]:
        role = "user" if h.get("role") == "user" else "assistant"
        text = h.get("text", "")
        if text:
            messages.append({"role": role, "content": text})
            
    messages.append({"role": "user", "content": message})
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=800,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API Error: {e}")
        return _fallback(message, teach_mode)

def get_reply(message: str, history=None, teach_mode: bool = False) -> str:
    if not message or not message.strip():
        return "Ask me anything about Indian wisdom — the Gita, dharma, focus, or how to begin."
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return _fallback(message, teach_mode)
        
    return _call_groq(message, history, teach_mode)
