from app import db
import time
import json
import uuid

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    data = db.Column(db.Text, nullable=True) # JSON payload
    project_type = db.Column(db.String(50), nullable=True) # e.g. 'notes', 'bookmark', 'saved_prompt'
    created_at = db.Column(db.Integer, default=lambda: int(time.time()))
    updated_at = db.Column(db.Integer, default=lambda: int(time.time()), onupdate=lambda: int(time.time()))

    def get_data(self):
        if not self.data:
            return {}
        try:
            return json.loads(self.data)
        except:
            return {}

    def to_json(self):
        return {
            "id": self.id,
            "uuid": self.uuid,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "data": self.get_data(),
            "type": self.project_type,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
