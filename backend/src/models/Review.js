import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    doctor: {
      type: String,  // String kyunki Appointment model mein doctor_id String hai
      required: true,
      index: true,
    },
    patient: {
      type: String,  // String kyunki patient_id String hai
      required: true,
      index: true,
    },
    appointment: {
      type: String,  // String kyunki appointment.id String hai
      required: true,
      unique: true,  // ONE REVIEW PER APPOINTMENT
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment 500 characters se zyada nahi ho sakta'],
    },

    // Doctor Reply
    doctorReply: {
      text: { type: String, default: '' },
      repliedAt: { type: Date },
    },

    // Admin Moderation
    isApproved: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    adminNote: { type: String, default: '' },

    // Verified Patient (appointment se auto-set)
    isVerifiedPatient: { type: Boolean, default: true },

    // Helpful Votes
    helpfulVotes: [
      {
        userId: { type: String },
      },
    ],

    // Report System
    reports: [
      {
        userId: { type: String },
        reason: { type: String },
        reportedAt: { type: Date, default: Date.now },
      },
    ],

    // Edit/Delete
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;