import Review from '../models/Review.js';
import Appointment from '../models/Appointment.js';
import logger from '../utils/logger.js';

// ✅ 1. REVIEW CREATE (Patient only)
export const createReview = async (req, res, next) => {
  try {
    const { doctorId, appointmentId, rating, comment } = req.body;
    const patientId = req.user.id;

    // Validation
    if (!rating) {
      return res.status(400).json({ detail: 'Rating required hai' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ detail: 'Comment required hai' });
    }

    // Appointment verify karo
    const appointment = await Appointment.findOne({ id: appointmentId });
    if (!appointment) {
      return res.status(404).json({ detail: 'Appointment nahi mili' });
    }
    if (appointment.patient_id !== patientId) {
      return res.status(403).json({ detail: 'Ye aapki appointment nahi hai' });
    }
    if (appointment.status !== 'completed') {
      return res.status(400).json({ detail: 'Sirf completed appointments pe review de sakte hain' });
    }
    if (appointment.hasReviewed) {
      return res.status(400).json({ detail: 'Is appointment ka review already de diya hai' });
    }

    const review = await Review.create({
      doctor: doctorId || appointment.doctor_id,
      patient: patientId,
      appointment: appointmentId,
      rating: Number(rating),
      comment,
      isVerifiedPatient: true,
    });

    // Appointment mein mark karo
    await Appointment.findOneAndUpdate({ id: appointmentId }, { hasReviewed: true });

    res.status(201).json({
      success: true,
      message: 'Review submit ho gaya! Admin approval ke baad dikhega.',
      review,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ detail: 'Is appointment ka review already exist karta hai' });
    }
    next(err);
  }
};

// ✅ 2. DOCTOR KE REVIEWS FETCH (Public)
export const getDoctorReviews = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1 },
      lowest: { rating: 1 },
    };

    const reviews = await Review.find({
      doctor: doctorId,
      isApproved: true,
      isDeleted: false,
    })
      .sort(sortOptions[sort] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments({
      doctor: doctorId,
      isApproved: true,
      isDeleted: false,
    });

    // Average rating
    const allRatings = await Review.find({
      doctor: doctorId,
      isApproved: true,
      isDeleted: false,
    }).select('rating');

    const avgRating =
      allRatings.length > 0
        ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1)
        : 0;

    res.json({
      success: true,
      reviews,
      avgRating,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// ✅ 3. REVIEW EDIT (Sirf apna)
export const editReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const patientId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ detail: 'Review nahi mila' });
    if (review.patient !== patientId) {
      return res.status(403).json({ detail: 'Sirf apna review edit kar sakte hain' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.isEdited = true;
    review.editedAt = new Date();
    review.isApproved = false; // Re-approval chahiye
    await review.save();

    res.json({ success: true, message: 'Review update ho gaya' });
  } catch (err) {
    next(err);
  }
};

// ✅ 4. REVIEW DELETE (Soft delete)
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const patientId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ detail: 'Review nahi mila' });
    if (review.patient !== patientId) {
      return res.status(403).json({ detail: 'Sirf apna review delete kar sakte hain' });
    }

    review.isDeleted = true;
    await review.save();

    // Appointment reset karo taaki dobara review de sake
    await Appointment.findOneAndUpdate({ id: review.appointment }, { hasReviewed: false });

    res.json({ success: true, message: 'Review delete ho gaya' });
  } catch (err) {
    next(err);
  }
};

// ✅ 5. HELPFUL VOTE TOGGLE
export const toggleHelpful = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ detail: 'Review nahi mila' });

    const alreadyVoted = review.helpfulVotes.some((v) => v.userId === userId);

    if (alreadyVoted) {
      review.helpfulVotes = review.helpfulVotes.filter((v) => v.userId !== userId);
    } else {
      review.helpfulVotes.push({ userId });
    }

    await review.save();
    res.json({
      success: true,
      helpful: !alreadyVoted,
      totalHelpful: review.helpfulVotes.length,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ 6. REPORT REVIEW
export const reportReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ detail: 'Review nahi mila' });

    const alreadyReported = review.reports.some((r) => r.userId === userId);
    if (alreadyReported) {
      return res.status(400).json({ detail: 'Aap pehle hi report kar chuke hain' });
    }

    review.reports.push({ userId, reason });
    await review.save();

    res.json({ success: true, message: 'Report submit ho gayi' });
  } catch (err) {
    next(err);
  }
};

// ✅ 7. DOCTOR REPLY
export const doctorReply = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { replyText } = req.body;

    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Sirf doctor reply kar sakta hai' });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { 'doctorReply.text': replyText, 'doctorReply.repliedAt': new Date() },
      { new: true }
    );

    if (!review) return res.status(404).json({ detail: 'Review nahi mila' });
    res.json({ success: true, message: 'Reply post ho gayi', review });
  } catch (err) {
    next(err);
  }
};

// ✅ 8. ADMIN — Saare reviews
export const adminGetAllReviews = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Admin access required' });
    }

    const { status = 'pending', page = 1, limit = 20 } = req.query;

    let filter = { isDeleted: false };
    if (status === 'pending')  filter = { ...filter, isApproved: false, isRejected: false };
    if (status === 'approved') filter = { ...filter, isApproved: true };
    if (status === 'rejected') filter = { ...filter, isRejected: true };
    if (status === 'reported') filter = { ...filter, 'reports.0': { $exists: true } };

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);
    res.json({ success: true, reviews, total });
  } catch (err) {
    next(err);
  }
};

// ✅ 9. ADMIN — Approve
export const adminApproveReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Admin access required' });
    }
    await Review.findByIdAndUpdate(req.params.reviewId, {
      isApproved: true,
      isRejected: false,
      adminNote: '',
    });
    res.json({ success: true, message: 'Review approve ho gaya' });
  } catch (err) {
    next(err);
  }
};

// ✅ 10. ADMIN — Reject
export const adminRejectReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Admin access required' });
    }
    const { reason } = req.body;
    await Review.findByIdAndUpdate(req.params.reviewId, {
      isApproved: false,
      isRejected: true,
      adminNote: reason || '',
    });
    res.json({ success: true, message: 'Review reject ho gaya' });
  } catch (err) {
    next(err);
  }
};