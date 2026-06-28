"""Vedyam API + static server. Pure Python standard library \u2014 no pip install needed.

Run:  python3 server.py
"""
import json
import mimetypes
import os
import re
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

from config import HOST, PORT, FRONTEND_DIR, GEMINI_API_KEY, APP_NAME
from db import get_db, init_db
from auth import hash_password, verify_password, create_token, verify_token
import chatbot

FRONTEND = str(FRONTEND_DIR)


class Api(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message


# ---------- serialisers ----------
def user_json(r):
    return {"id": r["id"], "name": r["name"], "email": r["email"],
            "role": r["role"], "bio": r["bio"] or "", "created_at": r["created_at"]}


def course_json(r):
    return {
        "id": r["id"], "title": r["title"], "category": r["category"],
        "level": r["level"], "duration": r["duration"], "summary": r["summary"],
        "description": r["description"], "lessons": json.loads(r["lessons"] or "[]"),
        "accent": r["accent"], "status": r["status"], "review_note": r["review_note"] or "",
        "instructor_id": r["instructor_id"],
        "instructor": r["instructor"] if "instructor" in r.keys() else None,
        "created_at": r["created_at"],
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "Vedyam/1.0"

    def log_message(self, fmt, *args):
        pass  # quiet

    # ---------- low-level helpers ----------
    def _send(self, status, body, ctype="application/json"):
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode("utf-8")
        elif isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if not length:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            raise Api(400, "Invalid JSON body")

    def _auth(self, conn, required=True):
        hdr = self.headers.get("Authorization", "")
        token = hdr[7:].strip() if hdr.startswith("Bearer ") else ""
        uid = verify_token(token) if token else None
        user = None
        if uid:
            row = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
            user = row
        if required and not user:
            raise Api(401, "Please sign in to continue")
        return user

    def _require_role(self, user, *roles):
        if not user or user["role"] not in roles:
            raise Api(403, "You do not have access to this action")

    # ---------- HTTP verbs ----------
    def do_OPTIONS(self):
        self._send(204, b"", "text/plain")

    def do_GET(self):
        path = urlparse(self.path).path
        if path.startswith("/api/"):
            return self._api("GET", path)
        return self._static(path)

    def do_POST(self):
        path = urlparse(self.path).path
        return self._api("POST", path)

    def do_PATCH(self):
        path = urlparse(self.path).path
        return self._api("PATCH", path)

    # ---------- static files ----------
    def _static(self, path):
        if path in ("", "/"):
            path = "/index.html"
        full = os.path.normpath(os.path.join(FRONTEND, path.lstrip("/")))
        if not full.startswith(FRONTEND):
            return self._send(403, "Forbidden", "text/plain")
        if not os.path.isfile(full):
            full = os.path.join(FRONTEND, "index.html")  # SPA fallback
        if not os.path.isfile(full):
            return self._send(404, "Not found", "text/plain")
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        with open(full, "rb") as f:
            data = f.read()
        self._send(200, data, ctype)

    # ---------- api dispatch ----------
    def _api(self, method, path):
        conn = get_db()
        try:
            qs = parse_qs(urlparse(self.path).query)
            result = self._route(method, path, conn, qs)
            conn.commit()
            status, payload = result if isinstance(result, tuple) else (200, result)
            self._send(status, payload)
        except Api as e:
            self._send(e.status, {"error": e.message})
        except Exception as e:
            self._send(500, {"error": "Server error", "detail": str(e)})
        finally:
            conn.close()

    def _route(self, method, path, conn, qs):
        # --- health / stats ---
        if method == "GET" and path == "/api/health":
            return {"ok": True, "app": APP_NAME, "gemini": bool(GEMINI_API_KEY)}
        if method == "GET" and path == "/api/stats":
            n_courses = conn.execute("SELECT COUNT(*) n FROM courses WHERE status='approved'").fetchone()["n"]
            n_learn = conn.execute("SELECT COUNT(*) n FROM users WHERE role='user'").fetchone()["n"]
            n_inst = conn.execute("SELECT COUNT(*) n FROM users WHERE role='instructor'").fetchone()["n"]
            return {"courses": n_courses, "learners": n_learn, "instructors": n_inst}

        # --- auth ---
        if method == "POST" and path == "/api/auth/register":
            return self._register(conn)
        if method == "POST" and path == "/api/auth/login":
            return self._login(conn)

        # --- me ---
        if method == "GET" and path == "/api/me":
            user = self._auth(conn)
            return {"user": user_json(user)}
        if method == "PATCH" and path == "/api/me":
            return self._update_me(conn)

        # --- courses ---
        if method == "GET" and path == "/api/courses":
            return self._list_courses(conn, qs)
        if method == "POST" and path == "/api/courses":
            return self._create_course(conn)
        if method == "GET" and path == "/api/my-courses":
            return self._my_courses(conn)
        if method == "GET" and path == "/api/admin/pending":
            return self._pending(conn)
        if method == "GET" and path == "/api/my-learning":
            return self._my_learning(conn)

        m = re.fullmatch(r"/api/course/(\d+)", path)
        if m and method == "GET":
            return self._get_course(conn, int(m.group(1)))
        m = re.fullmatch(r"/api/course/(\d+)/review", path)
        if m and method == "POST":
            return self._review(conn, int(m.group(1)))
        m = re.fullmatch(r"/api/course/(\d+)/enroll", path)
        if m and method == "POST":
            return self._enroll(conn, int(m.group(1)))
        m = re.fullmatch(r"/api/enrollment/(\d+)/progress", path)
        if m and method == "POST":
            return self._progress(conn, int(m.group(1)))

        # --- chat ---
        if method == "POST" and path == "/api/chat":
            return self._chat(conn)

        raise Api(404, "Unknown endpoint")

    # ---------- handlers ----------
    def _register(self, conn):
        b = self._body()
        name = (b.get("name") or "").strip()
        email = (b.get("email") or "").strip().lower()
        pw = b.get("password") or ""
        role = b.get("role") or "user"
        if role not in ("user", "instructor"):
            role = "user"  # superadmin cannot self-register
        if not name or not email or len(pw) < 6:
            raise Api(400, "Name, email and a 6+ character password are required")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise Api(400, "Please enter a valid email")
        exists = conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone()
        if exists:
            raise Api(409, "An account with this email already exists")
        cur = conn.execute(
            "INSERT INTO users (name,email,password,role,bio,created_at) VALUES (?,?,?,?,?,?)",
            (name, email, hash_password(pw), role, "", int(time.time())),
        )
        row = conn.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
        return {"token": create_token(row["id"]), "user": user_json(row)}

    def _login(self, conn):
        b = self._body()
        email = (b.get("email") or "").strip().lower()
        pw = b.get("password") or ""
        row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not row or not verify_password(pw, row["password"]):
            raise Api(401, "Incorrect email or password")
        return {"token": create_token(row["id"]), "user": user_json(row)}

    def _update_me(self, conn):
        user = self._auth(conn)
        b = self._body()
        name = (b.get("name") or user["name"]).strip()
        bio = b.get("bio", user["bio"]) or ""
        conn.execute("UPDATE users SET name=?, bio=? WHERE id=?", (name, bio, user["id"]))
        row = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
        return {"user": user_json(row)}

    def _list_courses(self, conn, qs):
        rows = conn.execute(
            """SELECT c.*, u.name AS instructor FROM courses c
               LEFT JOIN users u ON u.id=c.instructor_id
               WHERE c.status='approved' ORDER BY c.created_at DESC"""
        ).fetchall()
        return {"courses": [course_json(r) for r in rows]}

    def _get_course(self, conn, cid):
        row = conn.execute(
            """SELECT c.*, u.name AS instructor FROM courses c
               LEFT JOIN users u ON u.id=c.instructor_id WHERE c.id=?""", (cid,)
        ).fetchone()
        if not row:
            raise Api(404, "Course not found")
        if row["status"] != "approved":
            user = self._auth(conn, required=False)
            allowed = user and (user["role"] == "superadmin" or user["id"] == row["instructor_id"])
            if not allowed:
                raise Api(404, "Course not found")
        return {"course": course_json(row)}

    def _create_course(self, conn):
        user = self._auth(conn)
        self._require_role(user, "instructor", "superadmin")
        b = self._body()
        title = (b.get("title") or "").strip()
        if not title:
            raise Api(400, "A course title is required")
        lessons = b.get("lessons") or []
        if isinstance(lessons, str):
            lessons = [s.strip() for s in lessons.split("\n") if s.strip()]
        cur = conn.execute(
            """INSERT INTO courses
               (title,category,level,duration,summary,description,lessons,accent,
                instructor_id,status,review_note,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (title, b.get("category") or "Wisdom", b.get("level") or "Foundation",
             b.get("duration") or "4 weeks", b.get("summary") or "",
             b.get("description") or "", json.dumps(lessons), b.get("accent") or "indigo",
             user["id"], "proposed", "", int(time.time())),
        )
        row = conn.execute("SELECT * FROM courses WHERE id=?", (cur.lastrowid,)).fetchone()
        return {"course": course_json(row)}

    def _my_courses(self, conn):
        user = self._auth(conn)
        self._require_role(user, "instructor", "superadmin")
        rows = conn.execute(
            "SELECT c.*, u.name AS instructor FROM courses c LEFT JOIN users u ON u.id=c.instructor_id "
            "WHERE c.instructor_id=? ORDER BY c.created_at DESC", (user["id"],)
        ).fetchall()
        return {"courses": [course_json(r) for r in rows]}

    def _pending(self, conn):
        user = self._auth(conn)
        self._require_role(user, "superadmin")
        rows = conn.execute(
            "SELECT c.*, u.name AS instructor FROM courses c LEFT JOIN users u ON u.id=c.instructor_id "
            "WHERE c.status='proposed' ORDER BY c.created_at ASC"
        ).fetchall()
        return {"courses": [course_json(r) for r in rows]}

    def _review(self, conn, cid):
        user = self._auth(conn)
        self._require_role(user, "superadmin")
        b = self._body()
        action = b.get("action")
        if action not in ("approve", "reject"):
            raise Api(400, "action must be 'approve' or 'reject'")
        row = conn.execute("SELECT * FROM courses WHERE id=?", (cid,)).fetchone()
        if not row:
            raise Api(404, "Course not found")
        status = "approved" if action == "approve" else "rejected"
        conn.execute("UPDATE courses SET status=?, review_note=? WHERE id=?",
                     (status, b.get("note") or "", cid))
        return {"id": cid, "status": status}

    def _enroll(self, conn, cid):
        user = self._auth(conn)
        self._require_role(user, "user")
        course = conn.execute("SELECT * FROM courses WHERE id=? AND status='approved'", (cid,)).fetchone()
        if not course:
            raise Api(404, "Course not found")
        try:
            conn.execute("INSERT INTO enrollments (user_id,course_id,progress,created_at) VALUES (?,?,?,?)",
                         (user["id"], cid, 0, int(time.time())))
        except Exception:
            pass  # already enrolled
        return {"enrolled": True, "course_id": cid}

    def _my_learning(self, conn):
        user = self._auth(conn)
        rows = conn.execute(
            """SELECT e.id AS enrollment_id, e.progress, c.* FROM enrollments e
               JOIN courses c ON c.id=e.course_id
               WHERE e.user_id=? ORDER BY e.created_at DESC""", (user["id"],)
        ).fetchall()
        items = []
        for r in rows:
            d = course_json(r)
            d["enrollment_id"] = r["enrollment_id"]
            d["progress"] = r["progress"]
            items.append(d)
        return {"learning": items}

    def _progress(self, conn, eid):
        user = self._auth(conn)
        b = self._body()
        try:
            p = max(0, min(100, int(b.get("progress", 0))))
        except (TypeError, ValueError):
            raise Api(400, "progress must be a number")
        row = conn.execute("SELECT * FROM enrollments WHERE id=? AND user_id=?", (eid, user["id"])).fetchone()
        if not row:
            raise Api(404, "Enrollment not found")
        conn.execute("UPDATE enrollments SET progress=? WHERE id=?", (p, eid))
        return {"enrollment_id": eid, "progress": p}

    def _chat(self, conn):
        b = self._body()
        msg = b.get("message") or ""
        history = b.get("history") or []
        teach = bool(b.get("teach_mode"))
        reply = chatbot.get_reply(msg, history, teach)
        return {"reply": reply, "teach_mode": teach}


def main():
    init_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    mode = "LIVE (Gemini)" if GEMINI_API_KEY else "offline demo"
    print(f"\n    {APP_NAME} running at http://{HOST}:{PORT}")
    print(f"      Chatbot mode: {mode}")
    print(f"      Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Shutting down.\n")
        httpd.server_close()


if __name__ == "__main__":
    main()
