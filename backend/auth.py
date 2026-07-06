"""Password hashing + signed tokens using only the Python standard library."""
import base64
import hashlib
import hmac
import json
import os
import time

from config import SECRET_KEY, TOKEN_TTL


def hash_password(password: str, salt=None) -> str:
    if salt is None:
        salt = os.urandom(16)
    elif isinstance(salt, str):
        salt = bytes.fromhex(salt)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, _ = stored.split("$", 1)
    except (ValueError, AttributeError):
        return False
    return hmac.compare_digest(hash_password(password, salt_hex), stored)


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64d(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def create_token(user_id: int) -> str:
    payload = {"uid": user_id, "exp": int(time.time()) + TOKEN_TTL}
    body = _b64e(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = _b64e(hmac.new(SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def verify_token(token: str):
    try:
        body, sig = token.split(".", 1)
        expected = _b64e(
            hmac.new(SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_b64d(body))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return int(payload.get("uid"))
    except Exception:
        return None
