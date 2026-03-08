import DoctorProfile from '../models/DoctorProfile.js';
import appointmentService from '../services/appointment.service.js';

class DoctorController {
  // Get doctor profile
  async getProfile(req, res, next) {
    try {
      let profile = await DoctorProfile.findOne();

      if (!profile) {
        // Create default profile with Dr. Annu Sharma
        profile = await DoctorProfile.create({});
      }

      res.json(profile.toObject());
    } catch (error) {
      next(error);
    }
  }

  // Update doctor profile
  async updateProfile(req, res, next) {
    try {
      // Only doctor can update profile
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ detail: 'Only doctors can update profile' });
      }

      // Delete existing and create new
      await DoctorProfile.deleteMany({});
      const profile = await DoctorProfile.create(req.body);

      res.json(profile.toObject());
    } catch (error) {
      next(error);
    }
  }

  // Get availability
  async getAvailability(req, res, next) {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ detail: 'Date parameter required' });
      }

      const slots = await appointmentService.getAvailableSlots(date);

      res.json(slots);
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorController();
