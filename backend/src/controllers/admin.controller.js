import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

class AdminController {
  // Get admin stats
  async getStats(req, res, next) {
    try {
      // Only admin can access
      if (req.user.role !== 'admin') {
        return res.status(403).json({ detail: 'Admin only' });
      }

      const totalPatients = await User.countDocuments({ role: 'patient' });
      const totalAppointments = await Appointment.countDocuments();
      const completedAppointments = await Appointment.countDocuments({
        status: 'completed',
      });
      const pendingAppointments = await Appointment.countDocuments({
        status: { $in: ['pending', 'confirmed'] },
      });

      res.json({
        total_patients: totalPatients,
        total_appointments: totalAppointments,
        completed_appointments: completedAppointments,
        pending_appointments: pendingAppointments,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
