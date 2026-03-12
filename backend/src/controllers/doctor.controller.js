import DoctorProfile from '../models/DoctorProfile.js';
import appointmentService from '../services/appointment.service.js';
import { getRedisClient } from '../config/redis.js';
import Review from '../models/Review.js';
import logger from '../utils/logger.js';

class DoctorController {
  // ── Get Doctor Profile ─────────────────────────────
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
        const newProfile = await DoctorProfile.create({});
        profile = newProfile.toObject();
      }

      if (redis) {
        await redis.setex(CACHE_KEY, 86400, JSON.stringify(profile));
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  // ── Update Doctor Profile ──────────────────────────
  async updateProfile(req, res, next) {
    try {
      const {
        full_name,
        bio,
        specialization,
        qualifications,
        degrees,
        languages,
        photo_url,
        consultation_fee,
        availability,
      } = req.body;

      // Existing profile update karo ya naya banao
      let profile = await DoctorProfile.findOne();

      if (profile) {
        // Update fields
        if (full_name) profile.full_name = full_name;
        if (bio) profile.bio = bio;
        if (specialization) profile.specialization = specialization;
        if (qualifications) profile.qualifications = qualifications;
        if (degrees) profile.degrees = degrees;
        if (req.body.experience_years !== undefined) profile.experience_years = req.body.experience_years;
        if (languages) profile.languages = languages;
        if (photo_url) profile.photo_url = photo_url;
        if (consultation_fee !== undefined) profile.consultation_fee = consultation_fee;
        if (availability) profile.availability = availability;
        profile.updated_at = new Date();
        await profile.save();
      } else {
        profile = await DoctorProfile.create({
          full_name,
          bio,
          specialization,
          qualifications,
          degrees,
          languages,
          photo_url,
          consultation_fee: consultation_fee || 100,
          availability,
        });
      }

      // Cache invalidate karo
      const redis = getRedisClient();
      if (redis) {
        await redis.del('doctor_profile');
        logger.info('Doctor profile cache invalidated');
      }

      res.json({ success: true, profile: profile.toObject() });
    } catch (error) {
      next(error);
    }
  }

  // ── Update Availability ────────────────────────────
  async updateAvailability(req, res, next) {
    try {
      const { availability } = req.body;
      // availability format:
      // { start_time: "18:00", end_time: "20:00", days: ["monday","tuesday",...] }

      let profile = await DoctorProfile.findOne();
      if (!profile) {
        return res.status(404).json({ detail: 'Profile nahi mila. Pehle profile banao.' });
      }

      profile.availability = availability;
      profile.updated_at = new Date();
      await profile.save();

      const redis = getRedisClient();
      if (redis) await redis.del('doctor_profile');

      res.json({ success: true, availability: profile.availability });
    } catch (error) {
      next(error);
    }
  }

  // ── Update Fee ─────────────────────────────────────
  async updateFee(req, res, next) {
    try {
      const { consultation_fee } = req.body;

      if (!consultation_fee || consultation_fee < 0) {
        return res.status(400).json({ detail: 'Valid fee daalo' });
      }

      let profile = await DoctorProfile.findOne();
      if (!profile) {
        return res.status(404).json({ detail: 'Profile nahi mila' });
      }

      profile.consultation_fee = consultation_fee;
      profile.updated_at = new Date();
      await profile.save();

      const redis = getRedisClient();
      if (redis) await redis.del('doctor_profile');

      res.json({ success: true, consultation_fee: profile.consultation_fee });
    } catch (error) {
      next(error);
    }
  }

  // ── Update Photo ───────────────────────────────────
  async updatePhoto(req, res, next) {
    try {
      const { photo_url } = req.body;

      if (!photo_url) {
        return res.status(400).json({ detail: 'photo_url required' });
      }

      let profile = await DoctorProfile.findOne();
      if (!profile) {
        return res.status(404).json({ detail: 'Profile nahi mila' });
      }

      profile.photo_url = photo_url;
      profile.updated_at = new Date();
      await profile.save();

      const redis = getRedisClient();
      if (redis) await redis.del('doctor_profile');

      res.json({ success: true, photo_url: profile.photo_url });
    } catch (error) {
      next(error);
    }
  }

  // ── Get Availability Slots ─────────────────────────
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
        await redis.setex(CACHE_KEY, 300, JSON.stringify(slots));
      }

      res.json(slots);
    } catch (error) {
      next(error);
    }
  }

  // ── Get Doctor Reviews ─────────────────────────────
  async getDoctorReviews(req, res, next) {
    try {
      const { limit = 10, skip = 0 } = req.query;

      const reviews = await Review.find({ status: 'approved' })
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      const total = await Review.countDocuments({ status: 'approved' });

      // Average rating calculate karo
      const allReviews = await Review.find({ status: 'approved' }).lean();
      const avgRating = allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : 0;

      res.json({ reviews, total, average_rating: avgRating });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorController();