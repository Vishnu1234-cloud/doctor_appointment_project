import prescriptionService from '../services/prescription.service.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';

class PrescriptionController {
  // Create prescription
  async createPrescription(req, res, next) {
    try {
      // Only doctor can create prescriptions
      if (req.user.role !== 'doctor') {
        return res.status(403).json({ detail: 'Only doctors can create prescriptions' });
      }

      const { appointment_id, patient_id, diagnosis, medicines, notes } = req.body;

      const prescription = await prescriptionService.createPrescription({
        appointment_id,
        patient_id,
        doctor_id: req.user.id,
        diagnosis,
        medicines,
        notes,
      });

      res.status(201).json(prescription.toObject());
    } catch (error) {
      next(error);
    }
  }

  // Get prescriptions
  async getPrescriptions(req, res, next) {
    try {
      let query = {};

      if (req.user.role === 'patient') {
        query = { patient_id: req.user.id };
      }

      const prescriptions = await prescriptionService.getPrescriptions(query);

      res.json(prescriptions.map((p) => p.toObject()));
    } catch (error) {
      next(error);
    }
  }

  // Get prescription PDF
  async getPrescriptionPDF(req, res, next) {
    try {
      const { prescription_id } = req.params;

      const prescription = await prescriptionService.getPrescriptionById(prescription_id);

      if (!prescription) {
        return res.status(404).json({ detail: 'Prescription not found' });
      }

      // Check authorization
      if (
        req.user.role === 'patient' &&
        prescription.patient_id !== req.user.id
      ) {
        return res.status(403).json({ detail: 'Not authorized' });
      }

      // Get patient and doctor profile
      const patient = await User.findOne({ id: prescription.patient_id });
      const doctorProfile = await DoctorProfile.findOne() || {};

      // Generate PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=prescription_${prescription_id.substring(0, 8)}.pdf`
      );

      // Pipe PDF to response
      doc.pipe(res);

      // Header
      doc.fontSize(20).fillColor('#0F766E').text('HealthLine', { align: 'center' });
      doc.fontSize(10).fillColor('gray').text('Digital Prescription', { align: 'center' });
      doc.moveDown();
      doc.strokeColor('#0F766E').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Doctor info
      doc.fontSize(12).fillColor('black').text(doctorProfile.full_name || 'Dr. Annu Sharma', { bold: true });
      doc.fontSize(10).text(doctorProfile.qualifications || '');
      doc.text(`Registration No: ${doctorProfile.registration_number || ''}`);
      doc.moveDown();

      // Patient info
      doc.fontSize(11).text(`Patient: ${patient?.full_name || 'Patient'}`);
      doc.text(`Date: ${new Date(prescription.created_at).toLocaleDateString()}`);
      doc.text(`Prescription ID: ${prescription_id.substring(0, 8)}`);
      doc.moveDown();

      // Diagnosis
      doc.fontSize(14).fillColor('#0F766E').text('Diagnosis');
      doc.fontSize(11).fillColor('black').text(prescription.diagnosis);
      doc.moveDown();

      // Medicines
      doc.fontSize(14).fillColor('#0F766E').text('Prescribed Medicines');
      doc.moveDown(0.5);

      if (prescription.medicines && prescription.medicines.length > 0) {
        prescription.medicines.forEach((med, index) => {
          doc.fontSize(10).fillColor('black');
          doc.text(`${index + 1}. ${med.name}`);
          doc.text(`   Dosage: ${med.dosage || '-'}`);
          doc.text(`   Duration: ${med.duration || '-'}`);
          doc.text(`   Instructions: ${med.instructions || '-'}`);
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(10).text('No medicines prescribed.');
      }

      doc.moveDown();

      // Notes
      if (prescription.notes) {
        doc.fontSize(14).fillColor('#0F766E').text('Additional Notes');
        doc.fontSize(10).fillColor('black').text(prescription.notes);
        doc.moveDown();
      }

      // Footer
      doc.moveDown(2);
      doc.strokeColor('lightgray').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('gray').text(
        'This is a digitally generated prescription from HealthLine Telemedicine.',
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      logger.error('PDF generation error:', error);
      if (!res.headersSent) {
        next(error);
      }
    }
  }
}

export default new PrescriptionController();
