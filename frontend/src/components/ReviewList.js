import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import ReviewForm from './ReviewForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const Stars = ({ value }) => (
  <span className="text-yellow-400 text-sm">
    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
  </span>
);

export default function ReviewList({ doctorId }) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await axios.get(
        `${API}/reviews/doctor/${doctorId}?sort=${sort}&page=${page}&limit=5`
      );
      if (res.data.success) {
        setReviews(res.data.reviews);
        setAvgRating(res.data.avgRating);
        setTotal(res.data.total);
        setTotalPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchReviews(); }, [doctorId, sort, page]);

  const handleHelpful = async (reviewId) => {
    if (!token) return toast.error('Login karein pehle');
    try {
      const res = await axios.post(
        `${API}/reviews/${reviewId}/helpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) fetchReviews();
    } catch (err) { toast.error('Failed'); }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Review delete karna chahte hain?')) return;
    try {
      await axios.delete(
        `${API}/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Review delete ho gaya');
      fetchReviews();
    } catch (err) { toast.error('Delete nahi ho saka'); }
  };

  const handleReport = async (reviewId) => {
    if (!reportReason.trim()) return toast.error('Reason likhein');
    try {
      await axios.post(
        `${API}/reviews/${reviewId}/report`,
        { reason: reportReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Report submit ho gayi');
      setReportingId(null);
      setReportReason('');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Patient Reviews</h3>
          {total > 0 && (
            <p className="text-sm text-gray-500">
              ⭐ {avgRating} average · {total} reviews
            </p>
          )}
        </div>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
        >
          <option value="newest">Naye Pehle</option>
          <option value="oldest">Purane Pehle</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Abhi koi review nahi hai</p>
      ) : (
        reviews.map((review) => (
          <div key={review._id} className="border border-gray-100 rounded-xl p-4 mb-4 bg-white shadow-sm">
            {/* Top Row */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800 text-sm">
                    Patient #{review.patient?.slice(-4)}
                  </span>
                  {review.isVerifiedPatient && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ✓ Verified Patient
                    </span>
                  )}
                  {review.isEdited && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>
                <Stars value={review.rating} />
              </div>
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>

            {/* Comment */}
            <p className="text-gray-700 text-sm mb-3">{review.comment}</p>

            {/* Doctor Reply */}
            {review.doctorReply?.text && (
              <div className="bg-teal-50 border-l-4 border-teal-400 rounded-r-lg p-3 mb-3">
                <p className="text-xs font-semibold text-teal-700 mb-1">🩺 Doctor ka Reply:</p>
                <p className="text-sm text-teal-900">{review.doctorReply.text}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={() => handleHelpful(review._id)}
                className="text-sm text-gray-500 hover:text-teal-600 transition-colors"
              >
                👍 Helpful ({review.helpfulVotes?.length || 0})
              </button>

              <div className="flex gap-3">
                {user?.id === review.patient && (
                  <>
                    <button
                      onClick={() => setEditingId(editingId === review._id ? null : review._id)}
                      className="text-xs text-teal-500 hover:underline"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
                {user?.id !== review.patient && token && (
                  <button
                    onClick={() => setReportingId(reportingId === review._id ? null : review._id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    ⚑ Report
                  </button>
                )}
              </div>
            </div>

            {/* Inline Edit */}
            {editingId === review._id && (
              <ReviewForm
                existingReview={review}
                doctorId={review.doctor}
                appointmentId={review.appointment}
                onSuccess={() => { setEditingId(null); fetchReviews(); }}
              />
            )}

            {/* Inline Report */}
            {reportingId === review._id && (
              <div className="mt-3 bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-700 mb-2">Report ka karan:</p>
                <textarea
                  className="w-full border rounded p-2 text-sm mb-2"
                  rows={2}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Kyu report kar rahe hain?"
                />
                <button
                  onClick={() => handleReport(review._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Submit Report
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded text-sm ${
                page === i + 1 ? 'bg-teal-600 text-white' : 'border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}