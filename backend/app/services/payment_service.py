import razorpay
import os
import hmac
import hashlib

class PaymentProvider:
    def create_order(self, amount, currency, receipt, notes=None):
        raise NotImplementedError

    def verify_payment(self, order_id, payment_id, signature):
        raise NotImplementedError


class RazorpayProvider(PaymentProvider):
    def __init__(self):
        self.key_id = os.environ.get('RAZORPAY_KEY_ID', '')
        self.key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
        self.client = None
        if self.key_id and self.key_secret:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))

    def create_order(self, amount, currency='INR', receipt=None, notes=None):
        if not self.client:
            # For development, allow fallback if no keys configured yet
            return {"id": f"mock_order_{int(time.time())}", "amount": amount, "currency": currency}
            
        data = {
            "amount": amount,
            "currency": currency,
            "receipt": receipt,
            "notes": notes or {}
        }
        return self.client.order.create(data=data)

    def verify_payment(self, order_id, payment_id, signature):
        if not self.client:
            # Development mock fallback
            return True
            
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            })
            return True
        except Exception as e:
            print(f"Razorpay verification failed: {e}")
            return False

# Export a default instance
payment_service = RazorpayProvider()
