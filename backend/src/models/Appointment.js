import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patient_id: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    consultation_type: {
      type: String,
      enum: ['video', 'chat'],
      default: 'video',
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending',
      index: true,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    payment_id: String,
    razorpay_order_id: String,
    test_mode: {
      type: Boolean,
      default: false,
    },
    patient_joined_at: Date,
    doctor_joined_at: Date,
    completed_at: Date,
    cancelled_at: Date,
    cancellation_reason: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'appointments',
  }
);

// Indexes
appointmentSchema.index({ patient_id: 1, status: 1 });
appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ status: 1, date: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
