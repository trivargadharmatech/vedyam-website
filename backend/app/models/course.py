from app import db
import time
import json

class Course(db.Model):
    __tablename__ = 'courses'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.String(100), nullable=True)
    summary = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    lessons = db.Column(db.Text, nullable=True) # Stored as JSON string
    accent = db.Column(db.String(50), nullable=True)
    thumbnail = db.Column(db.String(500), nullable=True)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='proposed')
    review_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.Integer, default=lambda: int(time.time()))
    updated_at = db.Column(db.Integer, default=lambda: int(time.time()), onupdate=lambda: int(time.time()))

    enrollments = db.relationship('Enrollment', backref='course', lazy=True)

    def get_lessons(self):
        if not self.lessons:
            return []
        try:
            return json.loads(self.lessons)
        except:
            return []

    def to_json(self, include_instructor=True):
        data = {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "level": self.level,
            "duration": self.duration,
            "summary": self.summary,
            "description": self.description,
            "lessons": self.get_lessons(),
            "accent": self.accent,
            "thumbnail": self.thumbnail,
            "status": self.status,
            "review_note": self.review_note or "",
            "instructor_id": self.instructor_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        if include_instructor and self.instructor:
            data["instructor"] = self.instructor.name
        return data
