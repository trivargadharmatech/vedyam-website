"""
Migrates data from SQLite to PostgreSQL.
Usage:
  set DATABASE_URL=postgresql://user:password@host/dbname
  python scripts/migrate_sqlite_to_postgres.py
"""
import os
import sys
import sqlite3
import psycopg2
from psycopg2.extras import DictCursor

# Adjust path to import backend modules if needed, though we can just read sqlite directly here.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from config import DB_PATH

def migrate():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL environment variable is required.")
        sys.exit(1)

    print(f"Connecting to SQLite: {DB_PATH}")
    sl_conn = sqlite3.connect(DB_PATH)
    sl_conn.row_factory = sqlite3.Row
    sl_cur = sl_conn.cursor()

    print("Connecting to PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(db_url, cursor_factory=DictCursor)
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        sys.exit(1)
        
    pg_cur = pg_conn.cursor()

    # Create Tables via backend logic
    print("Initializing PostgreSQL Schema...")
    from db import init_db
    init_db()  # Ensures the schema is created on PostgreSQL side if it doesn't exist

    print("\n--- MIGRATING USERS ---")
    users = sl_cur.execute("SELECT * FROM users").fetchall()
    print(f"Found {len(users)} users in SQLite.")
    
    pg_cur.execute("DELETE FROM enrollments")
    pg_cur.execute("DELETE FROM courses")
    pg_cur.execute("DELETE FROM users")
    
    for u in users:
        pg_cur.execute(
            """INSERT INTO users (id, name, email, password, role, bio, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (u["id"], u["name"], u["email"], u["password"], u["role"], u["bio"], u["created_at"])
        )
    print(f"Migrated {len(users)} users.")

    print("\n--- MIGRATING COURSES ---")
    courses = sl_cur.execute("SELECT * FROM courses").fetchall()
    print(f"Found {len(courses)} courses in SQLite.")
    for c in courses:
        pg_cur.execute(
            """INSERT INTO courses (id, title, category, level, duration, summary, description,
               lessons, accent, instructor_id, status, review_note, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (c["id"], c["title"], c["category"], c["level"], c["duration"], c["summary"],
             c["description"], c["lessons"], c["accent"], c["instructor_id"], c["status"],
             c["review_note"], c["created_at"])
        )
    print(f"Migrated {len(courses)} courses.")

    print("\n--- MIGRATING ENROLLMENTS ---")
    enrollments = sl_cur.execute("SELECT * FROM enrollments").fetchall()
    print(f"Found {len(enrollments)} enrollments in SQLite.")
    for e in enrollments:
        pg_cur.execute(
            """INSERT INTO enrollments (id, user_id, course_id, progress, created_at)
               VALUES (%s, %s, %s, %s, %s)""",
            (e["id"], e["user_id"], e["course_id"], e["progress"], e["created_at"])
        )
    print(f"Migrated {len(enrollments)} enrollments.")

    # Fix sequences since we manually inserted IDs
    print("\nSynchronizing PostgreSQL sequences...")
    pg_cur.execute("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));")
    pg_cur.execute("SELECT setval('courses_id_seq', (SELECT COALESCE(MAX(id), 1) FROM courses));")
    pg_cur.execute("SELECT setval('enrollments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM enrollments));")

    pg_conn.commit()
    print("\nMigration completed successfully! (SQLite database remains untouched).")

    sl_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate()
