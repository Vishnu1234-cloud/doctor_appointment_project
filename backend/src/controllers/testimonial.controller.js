import Testimonial from '../models/Testimonial.js';
import Appointment from '../models/Appointment.js';
import { generateId } from '../utils/helpers.js';
import logger from '../utils/logger.js';

class TestimonialController {
  // Get testimonials
  async getTestimonials(req, res, next) {
    try {
      let testimonials = await Testimonial.find().sort({ created_at: -1 }).limit(100);

      // If no testimonials, seed with defaults
      if (testimonials.length === 0) {
        const defaults = [
          {
            id: generateId(),
            patient_id: 'default',
            appointment_id: 'default-1',
            patient_name: 'Verified Patient',
            rating: 5,
            comment:
              'The online consultation was incredibly convenient and professional. Dr. Annu Sharma took the time to understand my concerns and provided excellent guidance. Highly recommend for anyone seeking quality Ayurvedic healthcare from home.',
          },
          {
            id: generateId(),
            patient_id: 'default',
            appointment_id: 'default-2',
            patient_name: 'Verified Patient',
            rating: 5,
            comment:
              'Very impressed with the service! The video consultation was smooth, and I received my prescription digitally within minutes. Dr. Sharma was knowledgeable and compassionate. Perfect for busy professionals.',
          },
          {
            id: generateId(),
            patient_id: 'default',
            appointment_id: 'default-3',
            patient_name: 'Verified Patient',
            rating: 5,
            comment:
              'As someone who was hesitant about online consultations, this experience exceeded my expectations. The platform is easy to use, secure, and the medical advice was thorough and professional.',
          },
          {
            id: generateId(),
            patient_id: 'default',
            appointment_id: 'default-4',
            patient_name: 'Verified Patient',
            rating: 5,
            comment:
              "Outstanding service for women's health concerns. The doctor made me feel comfortable discussing sensitive topics and provided personalized Ayurvedic care. The convenience of booking and consulting from home is unbeatable.",
          },
          {
            id: generateId(),
            patient_id: 'default',
            appointment_id: 'default-5',
            patient_name: 'Verified Patient',
            rating: 5,
            comment:
              'Best telemedicine experience I\'ve had. The appointment booking was straightforward, consultation felt just like an in-person visit. Grateful for this modern healthcare solution with traditional Ayurvedic wisdom.',
          },
        ];

        testimonials = await Testimonial.insertMany(defaults);
      }

      res.json(testimonials.map((t) => t.toObject()));
    } catch (error) {
      next(error);
    }
  }

  // Create testimonial (review)
  async createTestimonial(req, res, next) {
    try {
      const { appointment_id, rating, comment } = req.body;

      // Verify appointment exists and belongs to user
      const appointment = await Appointment.findOne({ id: appointment_id });

      if (!appointment) {
        return res.status(404).json({ detail: 'Appointment not found' });
      }

      if (appointment.patient_id !== req.user.id) {
        return res.status(403).json({ detail: 'Not authorized' });
      }

      // Only allow review after appointment is completed
      if (appointment.status !== 'completed') {
        return res.status(400).json({
          detail: 'Can only submit review after appointment is completed',
        });
      }

      // Check if review already exists for this appointment
      const existing = await Testimonial.findOne({ appointment_id });
      if (existing) {
        return res.status(400).json({
          detail: 'Review already submitted for this appointment',
        });
      }

      // Create testimonial
      const testimonial = await Testimonial.create({
        id: generateId(),
        patient_id: req.user.id,
        appointment_id,
        patient_name: req.user.full_name,
        rating,
        comment,
      });

      logger.info(`Review created for appointment ${appointment_id}`);

      res.status(201).json(testimonial.toObject());
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error
        return res.status(400).json({
          detail: 'Review already exists for this appointment',
        });
      }
      next(error);
    }
  }
}

export default new TestimonialController();
