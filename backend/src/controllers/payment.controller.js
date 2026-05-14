import appointmentService from '../services/appointment.service.js';
import config from '../config/env.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { generateId } from '../utils/helpers.js';

class PaymentController {
  // Create payment order
  async createOrder(req, res, next) {
    try {
      const { amount, currency = 'INR', appointment_id } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ detail: 'Valid amount required' });
      }
      if (!appointment_id) {
        return res.status(400).json({ detail: 'appointment_id required' });
      }

      // Test Mode
      if (config.payment.testMode) {
        const mockOrder = {
          id: `order_test_${generateId().substring(0, 8)}`,
          amount,
          currency,
          status: 'created',
          test_mode: true,
        };
        await appointmentService.updatePaymentStatus(appointment_id, 'pending');
        return res.json(mockOrder);
      }

      // ✅ FIX: Real Razorpay integration
      if (!config.payment.razorpayKeyId || !config.payment.razorpayKeySecret) {
        return res.status(500).json({ detail: 'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env' });
      }

      const Razorpay = (await import('razorpay')).default;
      const razorpay = new Razorpay({
        key_id: config.payment.razorpayKeyId,
        key_secret: config.payment.razorpayKeySecret,
      });

      const order = await razorpay.orders.create({
        amount: amount * 100, // paise mein
        currency,
        receipt: appointment_id,
        notes: { appointment_id },
      });

      await appointmentService.updatePaymentStatus(appointment_id, 'pending');
      logger.info(`Razorpay order created: ${order.id}`);

      res.json({ id: order.id, amount: order.amount, currency: order.currency, status: order.status });
    } catch (error) {
      logger.error('Payment order creation failed:', error);
      next(error);
    }
  }

  // Verify payment
  async verifyPayment(req, res, next) {
    try {
      const {
        appointment_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        test_mode,
      } = req.body;

      if (!appointment_id) {
        return res.status(400).json({ detail: 'appointment_id required' });
      }

      // Test Mode
      if (config.payment.testMode || test_mode) {
        await appointmentService.updatePaymentStatus(
          appointment_id, 'completed',
          `pay_test_${generateId().substring(0, 8)}`
        );
        return res.json({ success: true, message: 'Test payment verified', test_mode: true });
      }

      // ✅ FIX: Razorpay signature verify karo (fake payment prevent karta hai)
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          detail: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature required',
        });
      }

      const expectedSignature = crypto
        .createHmac('sha256', config.payment.razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      // Timing-safe comparison (timing attack prevent karta hai)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(razorpay_signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        logger.warn(`Invalid Razorpay signature for appointment: ${appointment_id}`);
        return res.status(400).json({ detail: 'Payment verification failed: invalid signature' });
      }

      await appointmentService.updatePaymentStatus(appointment_id, 'completed', razorpay_payment_id);
      logger.info(`Payment verified: ${razorpay_payment_id}`);

      res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
      logger.error('Payment verification failed:', error);
      next(error);
    }
  }
}

export default new PaymentController();
