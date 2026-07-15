from app import db
import time

class OTP(db.Model):
    __tablename__ = 'otps'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.Integer, default=lambda: int(time.time()))
    expires_at = db.Column(db.Integer, nullable=False)
    used = db.Column(db.Boolean, default=False)

    def is_valid(self):
        return not self.used and int(time.time()) < self.expires_at
