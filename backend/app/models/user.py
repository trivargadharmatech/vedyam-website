from app import db
import time
import uuid

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True) # Optional for OAuth users
    provider = db.Column(db.String(50), nullable=True, default='email') # 'email' or 'google'
    profile_picture = db.Column(db.Text, nullable=True)
    role = db.Column(db.String(50), nullable=False, default='user')
    bio = db.Column(db.Text, nullable=True, default="")
    email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.Integer, default=lambda: int(time.time()))
    updated_at = db.Column(db.Integer, default=lambda: int(time.time()), onupdate=lambda: int(time.time()))
    last_login = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(50), nullable=True, default='active')

    enrollments = db.relationship('Enrollment', backref='user', lazy=True)
    projects = db.relationship('Project', backref='user', lazy=True)
    taught_courses = db.relationship('Course', backref='instructor', lazy=True)

    def to_json(self):
        return {
            "id": self.id,
            "uuid": self.uuid,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "bio": self.bio or "",
            "profile_picture": self.profile_picture,
            "created_at": self.created_at
        }
