# Vedyam \u2014 Backend

A self-contained JSON API + SQLite database built on the **Python standard library only**
(no `pip install`). It is a separate application that the Vedyam frontend depends on.

## Run it

```bash
python3 server.py            # http://127.0.0.1:8000
```

Requires Python 3.9+. The SQLite file `vedyam.db` is created and seeded on first run
(delete it to reset to seed data).

## Configuration (environment variables)

| Variable         | Default       | Purpose                                  |
|------------------|---------------|------------------------------------------|
| VEDYAM_HOST      | 127.0.0.1     | Bind host                                |
| VEDYAM_PORT      | 8000          | Bind port                                |
| VEDYAM_DB        | vedyam.db     | SQLite file path                         |
| VEDYAM_SECRET    | (dev default) | Token signing secret \u2014 set in production |
| GEMINI_API_KEY   | (none)        | Enables live chatbot answers             |
| GEMINI_MODEL     | gemini-2.5-flash | Gemini model for the chatbot          |

Without `GEMINI_API_KEY` the chatbot returns a graceful canned reply. See `.env.example`.

## CORS

The API sends `Access-Control-Allow-Origin: *`, so a frontend hosted on a different
origin/port can call it directly.

## Files

```
backend/
  server.py   HTTP routing, request/response, CORS, static passthrough (dev)
  db.py       schema + first-run seed data
  auth.py     password hashing + signed tokens
  chatbot.py  Gemini integration + fallback
  config.py   env-driven settings
```

See `../ARCHITECTURE.md` for the full picture and API contract.
