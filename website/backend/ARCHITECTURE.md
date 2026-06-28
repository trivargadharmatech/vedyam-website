# Vedyam \u2014 Architecture

Vedyam is split into **two independent applications** that talk to each other only over HTTP:

```
┌──────────────────────────┐         HTTPS / JSON          ┌──────────────────────────┐
│        FRONTEND          │  ───────────────────────────▶ │         BACKEND          │
│  Static SPA (HTML/CSS/JS)│   GET/POST/PATCH  /api/...    │  Python API + SQLite     │
│  Vanilla JS, no build    │ ◀───────────────────────────  │  (stdlib http.server)    │
│  Deploy anywhere static  │       JSON responses          │  + Gemini for chat       │
└──────────────────────────┘                               └──────────────────────────┘
         depends on  ───────────────────────────────────────────▶  the backend
```

The frontend **requires** the backend. There is no offline/standalone mode \u2014 if the
backend is unreachable, the UI shows a \u201Ccan\u2019t reach the backend\u201D notice with a retry.
The only coupling point is `frontend/js/config.js` \u2192 `API_BASE`.

---

## 1. Why two separate apps?

- **Independent deployability** \u2014 host the frontend on any static host (Netlify, S3,
  GitHub Pages, nginx) and the backend on any server; scale or redeploy each alone.
- **Clear contract** \u2014 they communicate through one well-defined JSON API.
- **Swappable** \u2014 the backend can be reimplemented (e.g. FastAPI, Node) without touching
  the frontend, as long as the API contract holds.

For convenience the backend can *also* serve the frontend\u2019s static files in local dev
(set `API_BASE: ""`), but that is optional, not required.

---

## 2. Frontend

| Aspect        | Choice                                                            |
|---------------|-------------------------------------------------------------------|
| Stack         | Vanilla HTML + CSS + JS (no framework, no build step)             |
| Routing       | Hash-based client router (`#/courses`, `#/course/3`, `#/admin`\u2026)  |
| State         | In-memory `state` object; auth token in `localStorage`            |
| Backend link  | `js/config.js` \u2192 `API_BASE`                                       |
| Design        | White-dominant, single blue accent, Google / NotebookLM-inspired  |

```
frontend/
  index.html        app shell (nav, main, footer)
  css/styles.css    design system (one accent, minimal black)
  js/config.js      API_BASE \u2014 the only place the backend URL lives
  js/app.js         router + all views + API client
```

**API client** adds the `Authorization: Bearer <token>` header, parses JSON, and throws
on non-2xx. A network failure flips `state.backendDown` and renders the notice \u2014 it never
fabricates data.

**Views:** Home (hero + chatbot + featured), Courses (search + filter), Course detail
(enroll + progress), Login, Register, My Learning, Teach (propose), Review Queue (admin),
Profile.

---

## 3. Backend

| Aspect        | Choice                                                            |
|---------------|-------------------------------------------------------------------|
| Language      | Python 3.9+ (standard library only \u2014 no pip install)              |
| HTTP server   | `http.server.ThreadingHTTPServer`                                 |
| Database      | SQLite (`sqlite3`), one connection per request                    |
| Auth          | PBKDF2-HMAC password hashing + HMAC-signed bearer tokens          |
| Chatbot       | Google Gemini via `urllib` when `GEMINI_API_KEY` is set           |
| CORS          | Open (`Access-Control-Allow-Origin: *`) so a separate frontend can call it |

```
backend/
  server.py     HTTP routing, request/response, static passthrough (dev), CORS
  db.py         SQLite schema + first-run seed data
  auth.py       password hashing + token sign/verify
  chatbot.py    Gemini call + graceful fallback reply
  config.py     env-driven settings
```

### Request lifecycle
1. `Handler` receives the request; `/api/*` \u2192 API dispatch, anything else \u2192 static file (dev).
2. A fresh SQLite connection is opened, the route runs, the transaction commits, the
   connection closes.
3. Errors raise an `Api(status, message)` exception serialised as `{ "error": ... }`.

---

## 4. Data model

```
users          (id, name, email, password, role, bio, created_at)
                 role ∈ { user, instructor, superadmin }
courses        (id, title, category, level, duration, summary, description,
                 lessons[JSON], accent, instructor_id→users, status, review_note, created_at)
                 status ∈ { proposed, approved, rejected }
enrollments    (id, user_id→users, course_id→courses, progress 0..100, created_at)
                 UNIQUE(user_id, course_id)
```

---

## 5. Roles & the course workflow

```
INSTRUCTOR                SUPER ADMIN                 LEARNER
    │ propose course          │                          │
    ▼                         │                          │
  status = proposed  ──────▶  │ sees Review Queue         │
                              │ approve ─▶ approved ──────▶ browse & enroll
                              │ decline ─▶ rejected        │  track progress 0\u2013100%
                              ▼                            ▼
                         review_note                   enrollments
```

- **Instructor** \u2014 proposes courses, sees their status + reviewer notes.
- **Super Admin** \u2014 reviews proposed courses, approves/declines with a note. (Seeded; not self-serve.)
- **Learner** \u2014 browses approved courses, enrolls, tracks progress.
- Everyone can use the **Vedyam chatbot** with an optional **Teach mode**.

---

## 6. API contract

| Method | Path                            | Auth         | Purpose                         |
|--------|---------------------------------|--------------|---------------------------------|
| GET    | /api/health                     | public       | Liveness + Gemini status        |
| GET    | /api/stats                      | public       | Course/learner/instructor counts|
| POST   | /api/auth/register              | public       | Create account (user/instructor)|
| POST   | /api/auth/login                 | public       | Get bearer token                |
| GET    | /api/me                         | signed in    | Current user                    |
| PATCH  | /api/me                         | signed in    | Update name/bio                 |
| GET    | /api/courses                    | public       | Approved courses                |
| GET    | /api/course/{id}                | public*      | Course detail                   |
| POST   | /api/courses                    | instructor   | Propose a course                |
| GET    | /api/my-courses                 | instructor   | My proposals                    |
| GET    | /api/admin/pending              | super admin  | Review queue                    |
| POST   | /api/course/{id}/review         | super admin  | Approve / decline               |
| POST   | /api/course/{id}/enroll         | learner      | Enroll                          |
| GET    | /api/my-learning                | learner      | Enrolled courses + progress     |
| POST   | /api/enrollment/{id}/progress   | learner      | Update progress                 |
| POST   | /api/chat                       | public       | Vedyam chatbot                  |

\u002A non-approved courses are visible only to their instructor or a super admin.

---

## 7. Running them separately

**Backend** (terminal 1):
```bash
cd backend
python3 server.py            # http://127.0.0.1:8000
```

**Frontend** (terminal 2) \u2014 any static server:
```bash
cd frontend
python3 -m http.server 5500  # http://127.0.0.1:5500
```
Set `frontend/js/config.js` \u2192 `API_BASE: "http://127.0.0.1:8000"` so the separately-hosted
frontend knows where the backend is. CORS on the backend allows the cross-origin calls.
