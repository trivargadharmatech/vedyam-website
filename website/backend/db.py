"""SQLite layer: schema, connection helper, and first-run seed data."""
import json
import sqlite3
import time

from config import DB_PATH
from auth import hash_password

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'user',   -- user | instructor | superadmin
    bio         TEXT DEFAULT '',
    created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    category      TEXT NOT NULL,
    level         TEXT NOT NULL DEFAULT 'Foundation',
    duration      TEXT NOT NULL DEFAULT '4 weeks',
    summary       TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    lessons       TEXT NOT NULL DEFAULT '[]',     -- JSON array of lesson titles
    accent        TEXT NOT NULL DEFAULT 'indigo', -- ui colour key
    instructor_id INTEGER,
    status        TEXT NOT NULL DEFAULT 'proposed', -- proposed | approved | rejected
    review_note   TEXT DEFAULT '',
    created_at    INTEGER NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    course_id  INTEGER NOT NULL,
    progress   INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    UNIQUE (user_id, course_id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
"""


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _seed(conn):
    cur = conn.execute("SELECT COUNT(*) AS n FROM users")
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
    for name, email, pw, role, bio in users:
        c = conn.execute(
            "INSERT INTO users (name,email,password,role,bio,created_at) VALUES (?,?,?,?,?,?)",
            (name, email, hash_password(pw), role, bio, now),
        )
        ids[role] = c.lastrowid
    instr = ids["instructor"]

    courses = [
        ("Inner Engineering", "Foundation", "Foundation", "6 weeks",
         "Understand the architecture of the mind and its relationship with consciousness.",
         "A practical foundation in Vedic psychology: how attention, emotion and identity "
         "actually work, and how to steady them.",
         ["The architecture of the mind", "Attention & awareness", "Working with emotion",
          "The witness self", "Daily stillness practice", "Integration"],
         "indigo", "approved"),
        ("Mental Clarity Systems", "Mindset", "Mindset", "4 weeks",
         "Eliminate cognitive fog and build reliable decision intelligence.",
         "A structured approach to clearing mental noise and making decisions you trust.",
         ["Sources of mental fog", "The clarity ritual", "Decision frameworks",
          "Sustained focus"],
         "sky", "approved"),
        ("Discipline Architecture", "Practice", "Practice", "5 weeks",
         "Move from erratic motivation to structural, effortless daily mastery.",
         "Design systems of practice rooted in the Vedic understanding of rhythm and habit.",
         ["Why willpower fails", "Rhythm & routine", "Habit loops", "Energy management",
          "The disciplined life"],
         "amber", "approved"),
        ("Life Purpose Framework", "Purpose", "Purpose", "8 weeks",
         "Map your Dharma through a structured exploration of values and strengths.",
         "Discover the unique role you are built for and orient your life around it.",
         ["What is Dharma?", "Mapping values", "Natural strengths", "Orientation to service",
          "Your purpose statement", "Living your dharma", "Obstacles", "Integration"],
         "rose", "approved"),
        ("Bhagavad Gita for Modern Life", "Wisdom", "Wisdom", "7 weeks",
         "The Gita's timeless guidance, translated into tools for everyday decisions.",
         "Walk through the Gita's core teachings and apply them to work, relationships and doubt.",
         ["The battlefield within", "Action without attachment", "The three gunas",
          "Devotion & focus", "Equanimity", "Self-knowledge", "Living the Gita"],
         "emerald", "approved"),
        ("Stillness & Focus", "Practice", "Practice", "3 weeks",
         "A short, practical track to build deep focus through Vedic stillness.",
         "Three weeks to a calmer, sharper mind using breath and attention practices.",
         ["The restless mind", "Breath as anchor", "Deep work, Vedic style"],
         "violet", "approved"),
        ("Vedic Decision-Making", "Mindset", "Mindset", "4 weeks",
         "A proposed course on choosing wisely under uncertainty, the Vedic way.",
         "Frameworks from the Gita and Nyaya logic for making hard calls with a clear head.",
         ["Clarity before choice", "Dharma & duty", "Weighing consequences", "Acting decisively"],
         "sky", "proposed"),
    ]
    for (title, cat, level, dur, summ, desc, lessons, accent, status) in courses:
        conn.execute(
            """INSERT INTO courses
               (title,category,level,duration,summary,description,lessons,accent,
                instructor_id,status,review_note,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (title, cat, level, dur, summ, desc, json.dumps(lessons), accent,
             instr, status, "", now),
        )

    # Give the demo learner a head start so the dashboard looks alive.
    conn.execute(
        "INSERT INTO enrollments (user_id,course_id,progress,created_at) VALUES (?,?,?,?)",
        (ids["user"], 1, 45, now),
    )
    conn.execute(
        "INSERT INTO enrollments (user_id,course_id,progress,created_at) VALUES (?,?,?,?)",
        (ids["user"], 5, 15, now),
    )
    conn.commit()


def init_db():
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()
    _seed(conn)
    conn.close()
