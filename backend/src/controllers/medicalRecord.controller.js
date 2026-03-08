import MedicalRecord from '../models/MedicalRecord.js';
import { generateId } from '../utils/helpers.js';
import logger from '../utils/logger.js';

class MedicalRecordController {
  // Upload medical record (metadata only)
  async uploadRecord(req, res, next) {
    try {
      const { description, record_type } = req.body;
      const file = req.file; // Assuming multer middleware

      if (!file) {
        return res.status(400).json({ detail: 'File required' });
      }

      const recordId = generateId();

      const record = await MedicalRecord.create({
        id: recordId,
        patient_id: req.user.id,
        record_type: record_type || 'report',
        file_name: file.filename || file.originalname,
        file_url: `/uploads/${recordId}_${file.originalname}`, // Mock URL
        description,
      });

      logger.info(`Medical record uploaded: ${recordId}`);

      res.status(201).json(record.toObject());
    } catch (error) {
      next(error);
    }
  }

  // Get medical records
  async getRecords(req, res, next) {
    try {
      let query = {};

      if (req.user.role === 'patient') {
        query = { patient_id: req.user.id };
      }

      const records = await MedicalRecord.find(query).sort({ uploaded_at: -1 });

      res.json(records.map((r) => r.toObject()));
    } catch (error) {
      next(error);
    }
  }
}

export default new MedicalRecordController();
