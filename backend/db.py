"""PostgreSQL layer: schema, connection helper, and first-run seed data."""
import os
import json
import time
from urllib.parse import urlparse

from config import DB_PATH
from auth import hash_password

# Use DATABASE_URL from environment for Postgres, fallback to local file path logic for SQLite fallback (only if strictly needed, but we migrate to PG entirely)
DATABASE_URL = os.environ.get("DATABASE_URL", "")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50) NOT NULL DEFAULT 'user',
    bio         TEXT DEFAULT '',
    created_at  BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    category      VARCHAR(100) NOT NULL,
    level         VARCHAR(50) NOT NULL DEFAULT 'Foundation',
    duration      VARCHAR(50) NOT NULL DEFAULT '4 weeks',
    summary       TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    lessons       JSONB NOT NULL DEFAULT '[]'::jsonb,
    accent        VARCHAR(50) NOT NULL DEFAULT 'indigo',
    instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status        VARCHAR(50) NOT NULL DEFAULT 'proposed',
    review_note   TEXT DEFAULT '',
    created_at    BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress   INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL,
    UNIQUE (user_id, course_id)
);

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_chunks (
    id          SERIAL PRIMARY KEY,
    source      VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding   vector(768),
    created_at  BIGINT NOT NULL
);
"""


def get_db():
    if not DATABASE_URL:
        # Fallback for local development if Postgres is not set up
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    # Postgres connection
    import psycopg2
    from psycopg2.extras import DictCursor
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=DictCursor)
    return PostgresWrapper(conn)


def _seed(conn):
    if not DATABASE_URL:
        # SQLite path
        cur = conn.execute("SELECT COUNT(*) AS n FROM users")
        if cur.fetchone()["n"] > 0:
            return
    else:
        # Postgres path
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS n FROM users")
        if cur.fetchone()["n"] > 0:
            return

    now = int(time.time())

    users = [
        ("Aacharya", "superadmin@vedyam.org", "admin123", "superadmin",
         "Curator of the Vedyam library. Reviews and approves every course."),
        ("Maitreyi", "instructor@vedyam.org", "teach123", "instructor",
         "Teacher of Vedic psychology and applied philosophy."),
        ("Arjun", "user@vedyam.org", "learn123", "user",
         "Seeker, learning to act with clarity and purpose."),
    ]
    ids = {}
    
    cur_exec = conn.cursor() if DATABASE_URL else conn
    
    for name, email, pw, role, bio in users:
        if DATABASE_URL:
            cur_exec.execute(
                "INSERT INTO users (name,email,password,role,bio,created_at) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                (name, email, hash_password(pw), role, bio, now)
            )
            ids[role] = cur_exec.fetchone()[0]
        else:
            c = cur_exec.execute(
                "INSERT INTO users (name,email,password,role,bio,created_at) VALUES (?,?,?,?,?,?)",
                (name, email, hash_password(pw), role, bio, now),
            )
            ids[role] = c.lastrowid
            
    instr = ids["instructor"]

    courses = [
        ("Inner Engineering", "Foundation", "Foundation", "6 weeks",
         "Understand the architecture of the mind and its relationship with consciousness.",
         "A practical foundation in Vedic psychology.",
         ["The architecture of the mind", "Attention & awareness", "Integration"],
         "indigo", "approved"),
    ]
    
    for (title, cat, level, dur, summ, desc, lessons, accent, status) in courses:
        if DATABASE_URL:
            cur_exec.execute(
                """INSERT INTO courses
                   (title,category,level,duration,summary,description,lessons,accent,
                    instructor_id,status,review_note,created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (title, cat, level, dur, summ, desc, json.dumps(lessons), accent,
                 instr, status, "", now),
            )
        else:
            cur_exec.execute(
                """INSERT INTO courses
                   (title,category,level,duration,summary,description,lessons,accent,
                    instructor_id,status,review_note,created_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (title, cat, level, dur, summ, desc, json.dumps(lessons), accent,
                 instr, status, "", now),
            )

    conn.commit()


def init_db():
    conn = get_db()
    if DATABASE_URL:
        cur = conn.cursor()
        cur.execute(SCHEMA)
        conn.commit()
    else:
        # SQLite doesn't support pgvector, strip it out
        schema_sqlite = SCHEMA.split("CREATE EXTENSION IF NOT EXISTS vector;")[0]
        schema_sqlite = schema_sqlite.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
        schema_sqlite = schema_sqlite.replace("BIGINT", "INTEGER").replace("JSONB", "TEXT")
        schema_sqlite = schema_sqlite.replace("VARCHAR(255)", "TEXT").replace("VARCHAR(100)", "TEXT").replace("VARCHAR(50)", "TEXT").replace("::jsonb", "")
        conn.executescript(schema_sqlite)
        conn.commit()
    _seed(conn)
    conn.close()

class _CursorResult:
    """Proxies a psycopg2 cursor but allows a settable `lastrowid`,
    since psycopg2's own `cursor.lastrowid` is a read-only built-in."""
    def __init__(self, cur):
        self._cur = cur
        self.lastrowid = None

    def __getattr__(self, name):
        return getattr(self._cur, name)


class PostgresWrapper:
    """A wrapper to make Postgres connection act like SQLite's `conn.execute()` for easy migration."""
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return self.conn.cursor()

    def execute(self, query, params=None):
        cur = self.conn.cursor()
        # Convert ? to %s for postgres
        if '?' in query:
            query = query.replace('?', '%s')

        is_insert = query.strip().upper().startswith("INSERT")
        if is_insert and "RETURNING" not in query.upper():
            query += " RETURNING id"

        cur.execute(query, params or ())

        result = _CursorResult(cur)
        if is_insert:
            row = cur.fetchone()
            if row:
                result.lastrowid = row[0]

        return result

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()
