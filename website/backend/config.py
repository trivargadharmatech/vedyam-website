"""Vedyam configuration. All values can be overridden via environment variables."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"

# --- Core ---
DB_PATH = os.environ.get("VEDYAM_DB", str(BASE_DIR / "vedyam.db"))
SECRET_KEY = os.environ.get("VEDYAM_SECRET", "vedyam-dev-secret-change-in-production")
HOST = os.environ.get("VEDYAM_HOST", "127.0.0.1")
PORT = int(os.environ.get("VEDYAM_PORT", "8000"))
TOKEN_TTL = int(os.environ.get("VEDYAM_TOKEN_TTL", str(60 * 60 * 24 * 7)))  # 7 days

# --- Vedyam chatbot (Google Gemini) ---
# Leave GEMINI_API_KEY empty to run in graceful offline "demo" mode.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_BASE_URL = os.environ.get(
    "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"
)

APP_NAME = "Vedyam"
APP_TAGLINE = "Ancient Wisdom. Modern Life."
