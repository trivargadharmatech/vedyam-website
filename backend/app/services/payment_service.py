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
        pass

    @property
    def key_id(self):
        return os.environ.get('RAZORPAY_KEY_ID', '').strip()

    @property
    def key_secret(self):
        return os.environ.get('RAZORPAY_KEY_SECRET', '').strip()

    @property
    def client(self):
        if self.key_id and self.key_secret:
            return razorpay.Client(auth=(self.key_id, self.key_secret))
        return None

    def create_order(self, amount, currency='INR', receipt=None, notes=None):
        client = self.client
        if not client:
            return {"id": f"mock_order_{int(time.time())}", "amount": amount, "currency": currency}
            
        data = {
            "amount": amount,
            "currency": currency,
            "receipt": receipt,
            "notes": notes or {}
        }
        return client.order.create(data=data)

    def verify_payment(self, order_id, payment_id, signature):
        client = self.client
        if not client:
            return True
            
        try:
            client.utility.verify_payment_signature({
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
