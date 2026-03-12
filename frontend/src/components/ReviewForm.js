import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className={`text-3xl transition-colors ${
          star <= value ? 'text-yellow-400' : 'text-gray-300'
        } hover:text-yellow-300`}
      >
        ★
      </button>
    ))}
  </div>
);

export default function ReviewForm({ doctorId, appointmentId, onSuccess, existingReview = null }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);

  const isEditing = !!existingReview;

  const handleSubmit = async () => {
    if (!rating) return toast.error('Kripya rating select karein');
    if (!comment.trim()) return toast.error('Comment likhna zaroori hai');

    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(
          `${API}/reviews/${existingReview._id}`,
          { rating, comment },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Review update ho gaya!');
      } else {
        await axios.post(
          `${API}/reviews`,
          { doctorId, appointmentId, rating, comment },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Review submit ho gaya! Admin approval ke baad dikhega 🙏');
      }
      onSuccess && onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Review submit nahi ho saka');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {isEditing ? '✏️ Review Edit Karein' : '⭐ Apna Experience Share Karein'}
      </h3>

      {/* Star Rating */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Rating:</p>
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="text-sm text-yellow-600 mt-1">
            {['', 'Bahut Bura', 'Bura', 'Theek Hai', 'Acha', 'Bahut Acha!'][rating]}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Aapka Anubhav:</p>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
          rows={4}
          placeholder="Doctor ke bare mein apna anubhav likhein... (max 500 characters)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right">{comment.length}/500</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? 'Submit ho raha hai...' : isEditing ? 'Update Karein' : 'Review Submit Karein'}
      </button>
    </div>
  );
}