import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// ── Axios helper ──────────────────────────────────────
const api = (token) => axios.create({
  baseURL: API,
  headers: { Authorization: `Bearer ${token}` },
});

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'doctors') fetchDoctors();
    else if (activeTab === 'appointments') fetchAppointments();
    else if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]);

  // ── Fetch Functions ───────────────────────────────
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api(token).get('/admin/stats');
      setStats(res.data);
    } catch { toast.error('Stats load nahi ho sake'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api(token).get('/admin/users', {
        params: { role: 'patient', search, status: filterStatus }
      });
      setUsers(res.data.users);
    } catch { toast.error('Users load nahi ho sake'); }
    finally { setLoading(false); }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api(token).get('/admin/doctors', {
        params: { search, status: filterStatus }
      });
      setDoctors(res.data.doctors);
    } catch { toast.error('Doctors load nahi ho sake'); }
    finally { setLoading(false); }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api(token).get('/admin/appointments', {
        params: { status: filterStatus }
      });
      setAppointments(res.data.appointments);
    } catch { toast.error('Appointments load nahi ho sake'); }
    finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api(token).get('/admin/reviews', {
        params: { status: filterStatus || 'pending' }
      });
      setReviews(res.data.reviews);
    } catch { toast.error('Reviews load nahi ho sake'); }
    finally { setLoading(false); }
  };

  // ── Action Functions ──────────────────────────────
  const blockUser = async (userId) => {
    try {
      await api(token).patch(`/admin/users/${userId}/block`, { reason: 'Admin action' });
      toast.success('User block ho gaya');
      fetchUsers();
    } catch { toast.error('Block nahi ho saka'); }
  };

  const activateUser = async (userId) => {
    try {
      await api(token).patch(`/admin/users/${userId}/activate`);
      toast.success('User activate ho gaya');
      fetchUsers();
    } catch { toast.error('Activate nahi ho saka'); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Pakka delete karna hai?')) return;
    try {
      await api(token).delete(`/admin/users/${userId}`);
      toast.success('User delete ho gaya');
      fetchUsers();
    } catch { toast.error('Delete nahi ho saka'); }
  };

  const approveDoctor = async (doctorId) => {
    try {
      await api(token).patch(`/admin/doctors/${doctorId}/approve`);
      toast.success('Doctor approve ho gaya! ✅');
      fetchDoctors();
    } catch { toast.error('Approve nahi ho saka'); }
  };

  const rejectDoctor = async (doctorId) => {
    const reason = window.prompt('Rejection reason daalo:');
    if (!reason) return;
    try {
      await api(token).patch(`/admin/doctors/${doctorId}/reject`, { reason });
      toast.success('Doctor reject ho gaya');
      fetchDoctors();
    } catch { toast.error('Reject nahi ho saka'); }
  };

  const suspendDoctor = async (doctorId) => {
    const reason = window.prompt('Suspension reason daalo:');
    if (!reason) return;
    try {
      await api(token).patch(`/admin/doctors/${doctorId}/suspend`, { reason });
      toast.success('Doctor suspend ho gaya');
      fetchDoctors();
    } catch { toast.error('Suspend nahi ho saka'); }
  };

  const cancelAppointment = async (appointmentId) => {
    const reason = window.prompt('Cancel reason daalo:');
    if (!reason) return;
    try {
      await api(token).patch(`/admin/appointments/${appointmentId}/cancel`, { reason });
      toast.success('Appointment cancel ho gaya');
      fetchAppointments();
    } catch { toast.error('Cancel nahi ho saka'); }
  };

  const approveReview = async (reviewId) => {
    try {
      await api(token).patch(`/admin/reviews/${reviewId}/approve`);
      toast.success('Review approve ho gayi ✅');
      fetchReviews();
    } catch { toast.error('Approve nahi ho saka'); }
  };

  const rejectReview = async (reviewId) => {
    try {
      await api(token).patch(`/admin/reviews/${reviewId}/reject`, { reason: 'Inappropriate content' });
      toast.success('Review reject ho gayi');
      fetchReviews();
    } catch { toast.error('Reject nahi ho saka'); }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Pakka delete karna hai?')) return;
    try {
      await api(token).delete(`/admin/reviews/${reviewId}`);
      toast.success('Review delete ho gayi');
      fetchReviews();
    } catch { toast.error('Delete nahi ho saka'); }
  };

  // ── Status Badge ──────────────────────────────────
  const StatusBadge = ({ status }) => {
    const colors = {
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-orange-100 text-orange-700',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      in_progress: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  const tabs = [
    { id: 'stats', label: '📊 Dashboard' },
    { id: 'users', label: '👥 Users' },
    { id: 'doctors', label: '👨‍⚕️ Doctors' },
    { id: 'appointments', label: '📅 Appointments' },
    { id: 'reviews', label: '⭐ Reviews' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🏥 HealthLine Admin</h1>
          <p className="text-teal-100 text-sm">Welcome, {user?.full_name}</p>
        </div>
        <button
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm"
        >
          Logout
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b px-6 flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(''); setFilterStatus(''); }}
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

      <div className="p-6">

        {/* ══ STATS TAB ══════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Overview</h2>
            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : stats ? (
              <div>
                {/* Main Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Patients', value: stats.total_patients, icon: '👥', color: 'bg-blue-50 border-blue-200' },
                    { label: 'Total Doctors', value: stats.total_doctors, icon: '👨‍⚕️', color: 'bg-teal-50 border-teal-200' },
                    { label: 'Total Appointments', value: stats.total_appointments, icon: '📅', color: 'bg-purple-50 border-purple-200' },
                    { label: 'Pending Reviews', value: stats.pending_reviews, icon: '⭐', color: 'bg-yellow-50 border-yellow-200' },
                  ].map((stat) => (
                    <div key={stat.label} className={`${stat.color} border rounded-2xl p-4`}>
                      <div className="text-3xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Appointment Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Completed', value: stats.completed_appointments, color: 'text-green-600' },
                    { label: 'Pending', value: stats.pending_appointments, color: 'text-yellow-600' },
                    { label: 'Cancelled', value: stats.cancelled_appointments, color: 'text-red-600' },
                    { label: 'Last 7 Days', value: stats.recent_appointments_7days, color: 'text-blue-600' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white border rounded-2xl p-4 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-sm text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white border rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">⚡ Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setActiveTab('doctors')} className="bg-teal-600 text-white px-4 py-2 rounded-full text-sm hover:bg-teal-700">
                      👨‍⚕️ Doctor Requests Dekhein
                    </button>
                    <button onClick={() => setActiveTab('reviews')} className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm hover:bg-yellow-600">
                      ⭐ Pending Reviews ({stats.pending_reviews})
                    </button>
                    <button onClick={() => setActiveTab('appointments')} className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600">
                      📅 Appointments Dekhein
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ══ USERS TAB ══════════════════════════════════ */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">👥 Patient Management</h2>
              <span className="text-sm text-gray-400">{users.length} users</span>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                placeholder="Search naam, email..."
                className="border rounded-xl px-4 py-2 text-sm flex-1 max-w-xs"
              />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); }}
                className="border rounded-xl px-4 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <button onClick={fetchUsers} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm">
                🔍 Search
              </button>
            </div>

            {loading ? <p className="text-gray-400">Loading...</p> : (
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 text-gray-600">Email</th>
                      <th className="text-left px-4 py-3 text-gray-600">Phone</th>
                      <th className="text-left px-4 py-3 text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{u.full_name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={u.is_blocked ? 'blocked' : 'active'} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {u.is_blocked ? (
                              <button onClick={() => activateUser(u.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs hover:bg-green-200">
                                ✅ Activate
                              </button>
                            ) : (
                              <button onClick={() => blockUser(u.id)} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs hover:bg-orange-200">
                                🚫 Block
                              </button>
                            )}
                            <button onClick={() => deleteUser(u.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs hover:bg-red-200">
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Koi user nahi mila</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ DOCTORS TAB ════════════════════════════════ */}
        {activeTab === 'doctors' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">👨‍⚕️ Doctor Management</h2>
              <span className="text-sm text-gray-400">{doctors.length} doctors</span>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDoctors()}
                placeholder="Search naam, email..."
                className="border rounded-xl px-4 py-2 text-sm flex-1 max-w-xs"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-xl px-4 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              <button onClick={fetchDoctors} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm">
                🔍 Search
              </button>
            </div>

            {loading ? <p className="text-gray-400">Loading...</p> : (
              <div className="grid gap-4">
                {doctors.map((d) => (
                  <div key={d.id} className="bg-white border rounded-2xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">Dr. {d.full_name}</h3>
                        <p className="text-sm text-gray-500">{d.email}</p>
                        <p className="text-sm text-gray-500">{d.phone || '—'}</p>
                        {d.consultation_fee && (
                          <p className="text-sm text-teal-600 font-medium mt-1">Fee: ₹{d.consultation_fee}</p>
                        )}
                        {d.suspension_reason && (
                          <p className="text-xs text-orange-500 mt-1">Suspended: {d.suspension_reason}</p>
                        )}
                        {d.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1">Rejected: {d.rejection_reason}</p>
                        )}
                      </div>
                      <StatusBadge status={d.doctor_status || 'pending'} />
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {d.doctor_status !== 'approved' && (
                        <button onClick={() => approveDoctor(d.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs hover:bg-green-200">
                          ✅ Approve
                        </button>
                      )}
                      {d.doctor_status !== 'rejected' && (
                        <button onClick={() => rejectDoctor(d.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs hover:bg-red-200">
                          ❌ Reject
                        </button>
                      )}
                      {d.doctor_status !== 'suspended' && (
                        <button onClick={() => suspendDoctor(d.id)} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs hover:bg-orange-200">
                          🚫 Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {doctors.length === 0 && (
                  <div className="bg-white border rounded-2xl p-8 text-center text-gray-400">
                    Koi doctor nahi mila
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ APPOINTMENTS TAB ═══════════════════════════ */}
        {activeTab === 'appointments' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📅 Appointment Management</h2>
              <span className="text-sm text-gray-400">{appointments.length} appointments</span>
            </div>

            {/* Filter */}
            <div className="flex gap-3 mb-4">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); fetchAppointments(); }}
                className="border rounded-xl px-4 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={fetchAppointments} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm">
                🔄 Refresh
              </button>
            </div>

            {loading ? <p className="text-gray-400">Loading...</p> : (
              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-600">ID</th>
                      <th className="text-left px-4 py-3 text-gray-600">Patient</th>
                      <th className="text-left px-4 py-3 text-gray-600">Date & Time</th>
                      <th className="text-left px-4 py-3 text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">{a.id?.slice(0, 8)}...</td>
                        <td className="px-4 py-3">{a.patient_id}</td>
                        <td className="px-4 py-3">{a.date} {a.time}</td>
                        <td className="px-4 py-3">{a.consultation_type === 'video' ? '🎥' : '💬'} {a.consultation_type}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-3">
                          {!['cancelled', 'completed'].includes(a.status) && (
                            <button onClick={() => cancelAppointment(a.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs hover:bg-red-200">
                              ❌ Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {appointments.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Koi appointment nahi mili</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ REVIEWS TAB ════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">⭐ Review Moderation</h2>
              <span className="text-sm text-gray-400">{reviews.length} reviews</span>
            </div>

            {/* Filter */}
            <div className="flex gap-3 mb-4">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); }}
                className="border rounded-xl px-4 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button onClick={fetchReviews} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm">
                🔄 Refresh
              </button>
            </div>

            {loading ? <p className="text-gray-400">Loading...</p> : (
              <div className="grid gap-4">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white border rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{r.patient_name || 'Patient'}</span>
                          <span className="text-yellow-500">{'⭐'.repeat(r.rating)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                        {r.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1">Reason: {r.rejection_reason}</p>
                        )}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      {r.status !== 'approved' && (
                        <button onClick={() => approveReview(r.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs hover:bg-green-200">
                          ✅ Approve
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => rejectReview(r.id)} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs hover:bg-orange-200">
                          ❌ Reject
                        </button>
                      )}
                      <button onClick={() => deleteReview(r.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs hover:bg-red-200">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="bg-white border rounded-2xl p-8 text-center text-gray-400">
                    Koi review nahi mili
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}