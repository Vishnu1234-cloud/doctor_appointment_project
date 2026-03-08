import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
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
    appointment_id: {
      type: String,
      required: true,
      unique: true, // One review per appointment
      index: true,
    },
    patient_name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'testimonials',
  }
);

// Indexes
testimonialSchema.index({ created_at: -1 });
testimonialSchema.index({ patient_id: 1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;
