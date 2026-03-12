import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAYS_HINDI = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

export default function DoctorProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);

  // Form state
  const [form, setForm] = useState({
    full_name: 'Dr. Annu Sharma',
    bio: '',
    specialization: [],
    qualifications: '',
    degrees: [],
    languages: ['Hindi', 'English'],
    photo_url: '',
    consultation_fee: 100,
    availability: {
      start_time: '18:00',
      end_time: '20:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
  });

  const [newSpecialization, setNewSpecialization] = useState('');
  const [newDegree, setNewDegree] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchReviews();
  }, []);

  const fetchProfile = async () => {
    setFetchLoading(true);
    try {
      const res = await axios.get(`${API}/doctor/profile`);
      const p = res.data;
      setForm({
        full_name: p.full_name || 'Dr. Annu Sharma',
        bio: p.bio || '',
        specialization: p.specialization || [],
        qualifications: p.qualifications || '',
        degrees: p.degrees || [],
        languages: p.languages || ['Hindi', 'English'],
        photo_url: p.photo_url || p.image_url || '',
        consultation_fee: p.consultation_fee || 100,
        availability: p.availability || {
          start_time: '18:00',
          end_time: '20:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
      });
    } catch { toast.error('Profile load nahi ho saka'); }
    finally { setFetchLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}/doctor/reviews`);
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.average_rating || 0);
    } catch { }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/doctor/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile save ho gaya! ✅');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Save nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  // ── Tag Helpers ───────────────────────────────────
  const addSpecialization = () => {
    if (!newSpecialization.trim()) return;
    setForm(f => ({ ...f, specialization: [...f.specialization, newSpecialization.trim()] }));
    setNewSpecialization('');
  };

  const removeSpecialization = (i) => {
    setForm(f => ({ ...f, specialization: f.specialization.filter((_, idx) => idx !== i) }));
  };

  const addDegree = () => {
    if (!newDegree.trim()) return;
    setForm(f => ({ ...f, degrees: [...f.degrees, newDegree.trim()] }));
    setNewDegree('');
  };

  const removeDegree = (i) => {
    setForm(f => ({ ...f, degrees: f.degrees.filter((_, idx) => idx !== i) }));
  };

  const addLanguage = () => {
    if (!newLanguage.trim()) return;
    setForm(f => ({ ...f, languages: [...f.languages, newLanguage.trim()] }));
    setNewLanguage('');
  };

  const removeLanguage = (i) => {
    setForm(f => ({ ...f, languages: f.languages.filter((_, idx) => idx !== i) }));
  };

  const toggleDay = (day) => {
    const days = form.availability.days;
    const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    setForm(f => ({ ...f, availability: { ...f.availability, days: updated } }));
  };

  const tabs = [
    { id: 'basic', label: '👤 Basic Info' },
    { id: 'qualifications', label: '🎓 Qualifications' },
    { id: 'availability', label: '📅 Availability' },
    { id: 'reviews', label: '⭐ Reviews' },
  ];

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Profile load ho raha hai...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">👨‍⚕️ Doctor Profile</h1>
          <p className="text-teal-100 text-sm">Apna profile manage karein</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm"
          >
            ← Dashboard
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-white text-teal-700 font-semibold px-4 py-2 rounded-full text-sm hover:bg-teal-50"
          >
            {loading ? 'Save ho raha hai...' : '💾 Save Karein'}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b px-6 flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto p-6">

        {/* ══ BASIC INFO TAB ═════════════════════════════ */}
        {activeTab === 'basic' && (
          <div className="space-y-6">

            {/* Photo Preview */}
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="font-semibold text-gray-700 mb-4">📸 Profile Photo</h3>
              <div className="flex items-center gap-4">
                <img
                  src={form.photo_url || 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100'}
                  alt="Doctor"
                  className="w-20 h-20 rounded-full object-cover border-2 border-teal-200"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100'; }}
                />
                <div className="flex-1">
                  <label className="text-sm text-gray-600 mb-1 block">Photo URL</label>
                  <input
                    value={form.photo_url}
                    onChange={(e) => setForm(f => ({ ...f, photo_url: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full border rounded-xl px-4 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Koi bhi image URL paste karein</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
              <h3 className="font-semibold text-gray-700">👤 Basic Information</h3>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm"
                  placeholder="Dr. Annu Sharma"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm"
                  rows={4}
                  placeholder="Apne baare mein likhein..."
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={form.consultation_fee}
                  onChange={(e) => setForm(f => ({ ...f, consultation_fee: parseInt(e.target.value) }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm"
                  min={0}
                />
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="font-semibold text-gray-700 mb-4">🌐 Languages</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.languages.map((lang, i) => (
                  <span key={i} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {lang}
                    <button onClick={() => removeLanguage(i)} className="text-teal-400 hover:text-red-500 ml-1">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
                  pl