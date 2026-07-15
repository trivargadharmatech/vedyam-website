from app import db
import time

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    razorpay_order_id = db.Column(db.String(100), nullable=False, unique=True)
    razorpay_payment_id = db.Column(db.String(100), nullable=True, unique=True)
    razorpay_signature = db.Column(db.String(200), nullable=True)
    amount = db.Column(db.Integer, nullable=False) # In smallest currency unit (e.g. paise)
    currency = db.Column(db.String(10), nullable=False, default='INR')
    status = db.Column(db.String(50), nullable=False, default='created') # created, paid, failed
    created_at = db.Column(db.Integer, default=lambda: int(time.time()))
    updated_at = db.Column(db.Integer, default=lambda: int(time.time()), onupdate=lambda: int(time.time()))

    def to_json(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "razorpay_order_id": self.razorpay_order_id,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "created_at": self.created_at
        }
