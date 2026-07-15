from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models.course import Course
from app.models.payment import Payment
from app.models.enrollment import Enrollment
from app.models.user import User
from app.services.payment_service import payment_service
import time
import json

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/debug', methods=['GET'])
def debug_keys():
    import os
    return jsonify({
        "key_id": os.environ.get('RAZORPAY_KEY_ID', 'MISSING'),
        "key_secret_len": len(os.environ.get('RAZORPAY_KEY_SECRET', '')),
        "keys_in_env": [k for k in os.environ.keys() if 'RAZORPAY' in k.upper()]
    })

@payment_bp.route('/create-order', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.json or {}
    course_id = data.get('course_id')

    if not course_id:
        return jsonify({"error": "Course ID is required"}), 400

    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404

    # Check if already enrolled
    existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if existing:
        return jsonify({"error": "You are already enrolled in this course"}), 400

    # Calculate amount in smallest unit (paise)
    amount_in_paise = int(course.price * 100) if course.price else 0
    
    # Even if course is free, we might bypass razorpay or create a 0 order, but Razorpay requires min 100 paise.
    # For this implementation, we assume all courses have a price > 0 as per our DB default (999).
    if amount_in_paise < 100:
        amount_in_paise = 100 # Minimum ₹1 to test

    try:
        if not payment_service.key_id:
            return jsonify({"error": "Razorpay keys are missing from the server environment. Please configure RAZORPAY_KEY_ID in Render Dashboard."}), 500

        order = payment_service.create_order(
            amount=amount_in_paise,
            currency="INR",
            receipt=f"receipt_{user_id}_{course_id}_{int(time.time())}",
            notes={"user_id": str(user_id), "course_id": str(course_id)}
        )
        
        # Store pending payment in DB
        payment = Payment(
            user_id=user_id,
            course_id=course_id,
            razorpay_order_id=order['id'],
            amount=amount_in_paise,
            currency="INR",
            status="created"
        )
        db.session.add(payment)
        db.session.commit()

        return jsonify({
            "order_id": order['id'],
            "amount": amount_in_paise,
            "currency": "INR",
            "key_id": payment_service.key_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create order: {str(e)}"}), 500

@payment_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    user_id = get_jwt_identity()
    data = request.json or {}
    
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_signature = data.get('razorpay_signature')
    
    if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
        return jsonify({"error": "Missing payment verification parameters"}), 400

    payment = Payment.query.filter_by(razorpay_order_id=razorpay_order_id).first()
    if not payment:
        return jsonify({"error": "Order not found"}), 404

    if payment.user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    if payment.status == 'paid':
        return jsonify({"message": "Already paid and enrolled"}), 200

    is_valid = payment_service.verify_payment(
        order_id=razorpay_order_id,
        payment_id=razorpay_payment_id,
        signature=razorpay_signature
    )

    if is_valid:
        payment.status = "paid"
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature

        # Create enrollment
        enrollment = Enrollment(
            user_id=user_id,
            course_id=payment.course_id,
            payment_id=payment.id,
            status="active",
            progress=0
        )
        db.session.add(enrollment)
        
        try:
            db.session.commit()
            return jsonify({"message": "Payment verified and enrollment successful!"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Database error while enrolling"}), 500
    else:
        payment.status = "failed"
        db.session.commit()
        return jsonify({"error": "Payment signature verification failed"}), 400

@payment_bp.route('/my-learning', methods=['GET'])
@jwt_required()
def my_learning():
    user_id = get_jwt_identity()
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    courses = []
    for e in enrollments:
        c = e.course.to_json()
        c['progress'] = e.progress
        c['enrollment_id'] = e.id
        courses.append(c)
    return jsonify(courses)

@payment_bp.route('/enrolled', methods=['GET'])
@jwt_required()
def enrolled():
    # Alias for my-learning if frontend uses it interchangeably
    return my_learning()
