import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import { generateId } from '../utils/helpers.js';
import logger from '../utils/logger.js';

class PrescriptionService {
  // Create prescription
  async createPrescription(prescriptionData) {
    const prescriptionId = generateId();

    const prescription = await Prescription.create({
      id: prescriptionId,
      ...prescriptionData,
    });

    // Update appointment status
    await Appointment.findOneAndUpdate(
      { id: prescriptionData.appointment_id },
      { $set: { status: 'completed', completed_at: new Date() } }
    );

    logger.info(`Prescription created: ${prescriptionId}`);
    return prescription;
  }

  // Get prescriptions
  async getPrescriptions(query = {}) {
    const prescriptions = await Prescription.find(query).sort({ created_at: -1 });
    return prescriptions;
  }

  // Get prescription by ID
  async getPrescriptionById(prescriptionId) {
    const prescription = await Prescription.findOne({ id: prescriptionId });
    return prescription;
  }

  // Get prescriptions for patient
  async getPatientPrescriptions(patientId) {
    const prescriptions = await Prescription.find({ patient_id: patientId }).sort({
      created_at: -1,
    });
    return prescriptions;
  }

  // Get prescriptions for appointment
  async getAppointmentPrescriptions(appointmentId) {
    const prescriptions = await Prescription.find({ appointment_id: appointmentId });
    return prescriptions;
  }
}

export default new PrescriptionService();
