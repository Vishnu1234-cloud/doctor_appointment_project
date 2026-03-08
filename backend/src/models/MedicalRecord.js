import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    patient_id: {
      type: String,
      required: true,
      index: true,
    },
    record_type: {
      type: String,
      enum: ['report', 'scan', 'prescription', 'other'],
      required: true,
    },
    file_name: String,
    file_url: String,
    description: String,
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'medical_records',
  }
);

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
