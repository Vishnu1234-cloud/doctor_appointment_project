import DoctorProfile from '../models/DoctorProfile.js';
import appointmentService from '../services/appointment.service.js';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

class DoctorController {
  // Get doctor profile
  async getProfile(req, res, next) {
    try {
      const redis = getRedisClient();
      const CACHE_KEY = 'doctor_profile';

      if (redis) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) return res.json(JSON.parse(cached));
      }

      let profile = await DoctorProfile.findOne().lean();

      if (!profile) {
        // Create default profile with Dr. Annu Sharma
        const newProfile = await DoctorProfile.create({});
        profile = newProfile.toObject();
      }

      if (redis) {
        await redis.setex(CACHE_KEY, 86400, JSON.stringify(profile)); // Cache for 24 hours
      }

      res.json(profile);
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

      // Invalidate cache natively
      const redis = getRedisClient();
      if (redis) {
        await redis.del('doctor_profile');
        logger.info('Doctor profile cache invalidated');
      }

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

      const redis = getRedisClient();
      const CACHE_KEY = `availability_${date}`;

      if (redis) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) return res.json(JSON.parse(cached));
      }

      const slots = await appointmentService.getAvailableSlots(date);

      if (redis) {
        // Cache availability slots for 5 minutes since these update slowly
        await redis.setex(CACHE_KEY, 300, JSON.stringify(slots));
      }

      res.json(slots);
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorController();
