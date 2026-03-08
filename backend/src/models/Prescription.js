import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    appointment_id: {
      type: String,
      required: true,
      index: true,
    },
    patient_id: {
      type: String,
      required: true,
      index: true,
    },
    doctor_id: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
    },
    medicines: {
      type: [
        {
          name: String,
          dosage: String,
          duration: String,
          instructions: String,
        },
      ],
      required: true,
    },
    notes: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'prescriptions',
  }
);

// Indexes
prescriptionSchema.index({ patient_id: 1, created_at: -1 });
prescriptionSchema.index({ appointment_id: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
