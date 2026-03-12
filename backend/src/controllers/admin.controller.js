import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Review from '../models/Review.js';
import logger from '../utils/logger.js';

class AdminController {

  // ── Stats / Analytics ──────────────────────────────
  async getStats(req, res, next) {
    try {
      const totalPatients = await User.countDocuments({ role: 'patient' });
      const totalDoctors = await User.countDocuments({ role: 'doctor' });
      const totalAppointments = await Appointment.countDocuments();
      const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
      const pendingAppointments = await Appointment.countDocuments({ status: { $in: ['pending', 'confirmed'] } });
      const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
      const totalReviews = await Review.countDocuments();
      const pendingReviews = await Review.countDocuments({ status: 'pending' });

      // Last 7 days appointments
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentAppointments = await Appointment.countDocuments({
        created_at: { $gte: sevenDaysAgo },
      });

      // Last 7 days new users
      const recentUsers = await User.countDocuments({
        created_at: { $gte: sevenDaysAgo },
      });

      res.json({
        total_patients: totalPatients,
        total_doctors: totalDoctors,
        total_appointments: totalAppointments,
        completed_appointments: completedAppointments,
        pending_appointments: pendingAppointments,
        cancelled_appointments: cancelledAppointments,
        total_reviews: totalReviews,
        pending_reviews: pendingReviews,
        recent_appointments_7days: recentAppointments,
        recent_users_7days: recentUsers,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── User Management ────────────────────────────────

  async getUsers(req, res, next) {
    try {
      const { role, search, status, limit = 50, skip = 0 } = req.query;

      let query = {};
      if (role) query.role = role;
      if (status === 'blocked') query.is_blocked = true;
      if (status === 'active') query.is_blocked = { $ne: true };
      if (search) {
        query.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await User.countDocuments(query);

      res.json({ users, total });
    } catch (error) {
      next(error);
    }
  }

  async getUserDetail(req, res, next) {
    try {
      const { user_id } = req.params;

      const user = await User.findOne({ id: user_id }).select('-password');
      if (!user) return res.status(404).json({ detail: 'User not found' });

      // User ki appointments bhi lo
      const appointments = await Appointment.find({ patient_id: user_id })
        .sort({ created_at: -1 })
        .limit(10);

      res.json({ user, appointments });
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req, res, next) {
    try {
      const { user_id } = req.params;
      const { reason } = req.body;

      const user = await User.findOneAndUpdate(
        { id: user_id },
        { $set: { is_blocked: true, blocked_reason: reason, blocked_at: new Date() } },
        { new: true }
      ).select('-password');

      if (!user) return res.status(404).json({ detail: 'User not found' });

      logger.info(`Admin blocked user: ${user_id}`);
      res.json({ success: true, message: 'User blocked', user });
    } catch (error) {
      next(error);
    }
  }

  async activateUser(req, res, next) {
    try {
      const { user_id } = req.params;

      const user = await User.findOneAndUpdate(
        { id: user_id },
        { $set: { is_blocked: false, blocked_reason: null, blocked_at: null } },
        { new: true }
      ).select('-password');

      if (!user) return res.status(404).json({ detail: 'User not found' });

      logger.info(`Admin activated user: ${user_id}`);
      res.json({ success: true, message: 'User activated', user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { user_id } = req.params;

      // Admin ko delete mat karo
      const user = await User.findOne({ id: user_id });
      if (!user) return res.status(404).json({ detail: 'User not found' });
      if (user.role === 'admin') return res.status(403).json({ detail: 'Cannot delete admin' });

      await User.deleteOne({ id: user_id });

      logger.info(`Admin deleted user: ${user_id}`);
      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ── Doctor Management ──────────────────────────────

  async getDoctors(req, res, next) {
    try {
      const { status, search, limit = 50, skip = 0 } = req.query;

      let query = { role: 'doctor' };
      if (status) query.doctor_status = status;
      if (search) {
        query.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const doctors = await User.find(query)
        .select('-password')
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await User.countDocuments(query);

      res.json({ doctors, total });
    } catch (error) {
      next(error);
    }
  }

  async approveDoctor(req, res, next) {
    try {
      const { doctor_id } = req.params;

      const doctor = await User.findOneAndUpdate(
        { id: doctor_id, role: 'doctor' },
        { $set: { doctor_status: 'approved', is_blocked: false, approved_at: new Date() } },
        { new: true }
      ).select('-password');

      if (!doctor) return res.status(404).json({ detail: 'Doctor not found' });

      logger.info(`Admin approved doctor: ${doctor_id}`);
      res.json({ success: true, message: 'Doctor approved', doctor });
    } catch (error) {
      next(error);
    }
  }

  async rejectDoctor(req, res, next) {
    try {
      const { doctor_id } = req.params;
      const { reason } = req.body;

      const doctor = await User.findOneAndUpdate(
        { id: doctor_id, role: 'doctor' },
        { $set: { doctor_status: 'rejected', rejection_reason: reason } },
        { new: true }
      ).select('-password');

      if (!doctor) return res.status(404).json({ detail: 'Doctor not found' });

      logger.info(`Admin rejected doctor: ${doctor_id}`);
      res.json({ success: true, message: 'Doctor rejected', doctor });
    } catch (error) {
      next(error);
    }
  }

  async suspendDoctor(req, res, next) {
    try {
      const { doctor_id } = req.params;
      const { reason } = req.body;

      const doctor = await User.findOneAndUpdate(
        { id: doctor_id, role: 'doctor' },
        { $set: { doctor_status: 'suspended', is_blocked: true, suspension_reason: reason } },
        { new: true }
      ).select('-password');

      if (!doctor) return res.status(404).json({ detail: 'Doctor not found' });

      logger.info(`Admin suspended doctor: ${doctor_id}`);
      res.json({ success: true, message: 'Doctor suspended', doctor });
    } catch (error) {
      next(error);
    }
  }

  async setDoctorFee(req, res, next) {
    try {
      const { doctor_id } = req.params;
      const { fee } = req.body;

      const doctor = await User.findOneAndUpdate(
        { id: doctor_id, role: 'doctor' },
        { $set: { consultation_fee: fee } },
        { new: true }
      ).select('-password');

      if (!doctor) return res.status(404).json({ detail: 'Doctor not found' });

      res.json({ success: true, message: 'Fee updated', doctor });
    } catch (error) {
      next(error);
    }
  }

  // ── Appointment Management ─────────────────────────

  async getAppointments(req, res, next) {
    try {
      const { status, search, date, limit = 50, skip = 0 } = req.query;

      let query = {};
      if (status) query.status = status;
      if (date) query.date = date;
      if (search) {
        query.$or = [
          { patient_id: { $regex: search, $options: 'i' } },
          { id: { $regex: search, $options: 'i' } },
        ];
      }

      const appointments = await Appointment.find(query)
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Appointment.countDocuments(query);

      res.json({ appointments, total });
    } catch (error) {
      next(error);
    }
  }

  async cancelAppointment(req, res, next) {
    try {
      const { appointment_id } = req.params;
      const { reason } = req.body;

      const appointment = await Appointment.findOneAndUpdate(
        { id: appointment_id },
        { $set: { status: 'cancelled', cancellation_reason: reason, cancelled_by: 'admin' } },
        { new: true }
      );

      if (!appointment) return res.status(404).json({ detail: 'Appointment not found' });

      logger.info(`Admin cancelled appointment: ${appointment_id}`);
      res.json({ success: true, message: 'Appointment cancelled', appointment });
    } catch (error) {
      next(error);
    }
  }

  async updateAppointmentStatus(req, res, next) {
    try {
      const { appointment_id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ detail: 'Invalid status' });
      }

      const appointment = await Appointment.findOneAndUpdate(
        { id: appointment_id },
        { $set: { status } },
        { new: true }
      );

      if (!appointment) return res.status(404).json({ detail: 'Appointment not found' });

      res.json({ success: true, message: 'Status updated', appointment });
    } catch (error) {
      next(error);
    }
  }

  // ── Review Moderation ──────────────────────────────

  async getReviews(req, res, next) {
    try {
      const { status, limit = 50, skip = 0 } = req.query;

      let query = {};
      if (status) query.status = status;

      const reviews = await Review.find(query)
        .sort({ created_at: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Review.countDocuments(query);

      res.json({ reviews, total });
    } catch (error) {
      next(error);
    }
  }

  async approveReview(req, res, next) {
    try {
      const { review_id } = req.params;

      const review = await Review.findOneAndUpdate(
        { id: review_id },
        { $set: { status: 'approved', moderated_at: new Date() } },
        { new: true }
      );

      if (!review) return res.status(404).json({ detail: 'Review not found' });

      res.json({ success: true, message: 'Review approved', review });
    } catch (error) {
      next(error);
    }
  }

  async rejectReview(req, res, next) {
    try {
      const { review_id } = req.params;
      const { reason } = req.body;

      const review = await Review.findOneAndUpdate(
        { id: review_id },
        { $set: { status: 'rejected', rejection_reason: reason, moderated_at: new Date() } },
        { new: true }
      );

      if (!review) return res.status(404).json({ detail: 'Review not found' });

      res.json({ success: true, message: 'Review rejected', review });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { review_id } = req.params;

      const review = await Review.findOneAndDelete({ id: review_id });
      if (!review) return res.status(404).json({ detail: 'Review not found' });

      logger.info(`Admin deleted review: ${review_id}`);
      res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();