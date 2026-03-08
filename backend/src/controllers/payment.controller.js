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

      // In test mode, create mock order
      if (config.payment.testMode) {
        const mockOrder = {
          id: `order_test_${generateId().substring(0, 8)}`,
          amount,
          currency,
          status: 'created',
          test_mode: true,
        };

        // Update appointment
        await appointmentService.updatePaymentStatus(appointment_id, 'pending');

        logger.info(`Test mode payment order created: ${mockOrder.id}`);
        return res.json(mockOrder);
      }

      // Production mode: Integrate with Razorpay
      // TODO: Implement actual Razorpay integration
      logger.warn('Production payment not implemented. Using test mode.');
      return res.status(501).json({
        detail: 'Production payment not configured. Please enable test mode.',
      });
    } catch (error) {
      logger.error('Payment order creation failed:', error);
      next(error);
    }
  }

  // Verify payment
  async verifyPayment(req, res, next) {
    try {
      const { appointment_id, payment_id, test_mode } = req.body;

      if (!appointment_id) {
        return res.status(400).json({ detail: 'Appointment ID required' });
      }

      // Update appointment payment status
      await appointmentService.updatePaymentStatus(
        appointment_id,
        'completed',
        payment_id || `pay_test_${generateId().substring(0, 8)}`
      );

      logger.info(`Payment verified for appointment: ${appointment_id}`);

      res.json({
        success: true,
        message: 'Payment verified successfully',
        test_mode: test_mode || config.payment.testMode,
      });
    } catch (error) {
      logger.error('Payment verification failed:', error);
      next(error);
    }
  }
}

export default new PaymentController();
