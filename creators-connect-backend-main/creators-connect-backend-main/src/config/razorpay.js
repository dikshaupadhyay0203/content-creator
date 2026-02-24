import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID || process.env.TEST_API_KEY;
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.TEST_SECRET_KEY;

if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay credentials. Set RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET or TEST_API_KEY/TEST_SECRET_KEY in src/.env');
}

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
});

export default razorpay;
export { keyId as razorpayKeyId };