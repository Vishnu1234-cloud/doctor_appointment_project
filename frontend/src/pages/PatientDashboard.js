import ReviewForm from '@/components/ReviewForm';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, MessageCircle, FileText, LogOut, Activity } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const font = "'Plus Jakarta Sans','Segoe UI',sans-serif";
const mono = "'JetBrains Mono','Courier New',monospace";

const T = {
  pageBg:     '#f8f7ff',
  cardBg:     '#ffffff',
  cardBorder: '#e8e4ff',
  navBg:      '#ffffff',
  navBorder:  '#e8e4ff',
  textPri:    '#1e1b4b',
  textSec:    '#6b7280',
  textMut:    '#9ca3af',
  divider:    '#f3f4f6',
  primary:    '#4f46e5',
  primaryDim: '#ede9fe',
  primaryBdr: '#c4b5fd',
  green:      '#059669',
  greenDim:   '#d1fae5',
  greenBdr:   '#a7f3d0',
  amber:      '#d97706',
  amberDim:   '#fef3c7',
  amberBdr:   '#fde68a',
  red:        '#dc2626',
  redDim:     '#fee2e2',
  redBdr:     '#fca5a5',
  nextBg:     '#f5f3ff',
  nextBdr:    '#c4b5fd',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`);
      setAppointments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const upcoming  = appointments.filter(a => ['confirmed','in_progress'].includes(a.status)).length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const pending   = appointments.filter(a => a.status === 'pending').length;
  const nextAppt  = appointments.find(a => a.status === 'confirmed');

  const statusStyle = (s) => {
    switch(s) {
      case 'confirmed':   return { color: T.green,   background: T.greenDim,   border: `1px solid ${T.greenBdr}` };
      case 'in_progress': return { color: T.primary,  background: T.primaryDim, border: `1px solid ${T.primaryBdr}` };
      case 'pending':     return { color: T.amber,    background: T.amberDim,   border: `1px solid ${T.amberBdr}` };
      case 'completed':   return { color: T.primary,  background: T.primaryDim, border: `1px solid ${T.primaryBdr}` };
      case 'cancelled':   return { color: T.red,      background: T.redDim,     border: `1px solid ${T.redBdr}` };
      default:            return { color: T.textSec,  background: T.pageBg,     border: `1px solid ${T.cardBorder}` };
    }
  };

  const canJoinConsultation = (s) => ['confirmed','in_progress'].includes(s);

  const quickActions = [
    { label: 'Book Appointment', icon: Calendar, path: '/patient/book-appointment', testId: 'quick-action-book' },
    { label: 'Prescriptions',    icon: FileText,  path: '/patient/prescriptions',    testId: 'quick-action-prescriptions' },
    { label: 'Medical History',  icon: Activity,  path: '/patient/medical-history',  testId: 'quick-action-history' },
  ];

  return (
    <div style={{ background: T.pageBg, minHeight: '100vh', fontFamily: font, color: T.textPri }}
      data-testid="patient-dashboard">

      {/* ── Header ── */}
      <header style={{ background: T.navBg, borderBottom: `1px solid ${T.navBorder}`, padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: T.textPri, margin: 0 }}
            data-testid="dashboard-logo">
            Health<span style={{ color: T.primary }}>Line</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: T.textSec, fontFamily: mono }}
              data-testid="user-name">
              {user?.full_name}
            </span>
            <button
              onClick={handleLogout}
              data-testid="logout-button"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999,
                border: `1px solid ${T.cardBorder}`, background: 'transparent',
                color: T.textSec, fontSize: 12, fontFamily: mono,
                cursor: 'pointer',
              }}
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>

        {/* ── Greeting ── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: 11, color: T.textMut, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px', color: T.textPri, margin: 0 }}
            data-testid="dashboard-title">
            Good {getGreeting()}, <span style={{ color: T.primary }}>{user?.full_name?.split(' ')[0]}</span> 👋
          </h2>
          <p style={{ fontSize: 13, color: T.textMut, marginTop: 4, fontFamily: mono }}
            data-testid="dashboard-subtitle">
            Manage your appointments and health records
          </p>
        </div>

        {/* ── Stats cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.5rem' }}>
          {[
            { n: upcoming,  l: 'Upcoming',  c: T.primary },
            { n: completed, l: 'Completed', c: T.green   },
            { n: pending,   l: 'Pending',   c: T.amber   },
          ].map(s => (
            <div key={s.l} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: '0.9rem 1.1rem' }}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: mono, color: s.c, marginBottom: 4 }}>{s.n}</div>
              <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: mono }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── Next appointment highlight ── */}
        {nextAppt && (
          <div style={{
            background: T.nextBg, border: `1px solid ${T.nextBdr}`,
            borderRadius: 14, padding: '1rem 1.3rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.primary, flexShrink: 0, boxShadow: `0 0 0 3px ${T.primaryDim}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 2 }}>
                {nextAppt.consultation_type === 'video' ? 'Video call' : 'Chat'} — upcoming
              </div>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: mono }}>
                {nextAppt.date} · {nextAppt.time} IST
              </div>
            </div>
            <div style={{ fontSize: 11, background: T.primaryDim, color: T.primary, padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.primaryBdr}`, fontFamily: mono }}>
              confirmed
            </div>
            <button
              onClick={() => navigate(`/consultation/${nextAppt.id}`)}
              style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: mono }}
            >Join</button>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono, marginBottom: '0.9rem' }}>
          Quick actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.75rem' }}>
          {quickActions.map(a => (
            <div
              key={a.label}
              onClick={() => navigate(a.path)}
              data-testid={a.testId}
              style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: '1.1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = T.primaryDim; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.background = T.cardBg; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: T.primaryDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a.icon size={17} color={T.primary} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, textAlign: 'center' }}>{a.label}</div>
            </div>
          ))}
        </div>

        {/* ── Appointments ── */}
        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono, marginBottom: '0.9rem' }}>
          My appointments
        </div>

        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}
          data-testid="appointments-card">

          {loading ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: T.textMut, fontFamily: mono, fontSize: 13 }}
              data-testid="loading-text">Loading...</p>

          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }} data-testid="no-appointments">
              <Calendar size={40} color={T.textMut} style={{ margin: '0 auto 12px' }} />
              <p style={{ color: T.textMut, fontSize: 13, fontFamily: mono, marginBottom: 16 }}>No appointments yet</p>
              <button
                onClick={() => navigate('/patient/book-appointment')}
                data-testid="book-first-appointment"
                style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}
              >Book Your First Appointment</button>
            </div>

          ) : (
            appointments.map((appointment, index) => (
              <div
                key={appointment.id}
                data-testid={`appointment-${index}`}
                style={{ padding: '1rem 1.25rem', borderBottom: index < appointments.length - 1 ? `1px solid ${T.divider}` : 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: appointment.consultation_type === 'video' ? T.primaryDim : T.greenDim,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {appointment.consultation_type === 'video'
                      ? <Video size={15} color={T.primary} />
                      : <MessageCircle size={15} color={T.green} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.textPri, margin: '0 0 2px' }}
                      data-testid={`appointment-reason-${index}`}>
                      {appointment.reason || 'Consultation'}
                    </p>
                    <p style={{ fontSize: 11, color: T.textSec, fontFamily: mono, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                      data-testid={`appointment-datetime-${index}`}>
                      <Clock size={11} /> {appointment.date} at {appointment.time}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      data-testid={`appointment-status-${index}`}
                      style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, fontFamily: mono, fontWeight: 500, ...statusStyle(appointment.status) }}
                    >{appointment.status}</span>

                    {canJoinConsultation(appointment.status) && (
                      <button
                        onClick={() => navigate(`/consultation/${appointment.id}`)}
                        data-testid={`join-consultation-${index}`}
                        style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: mono }}
                      >Join</button>
                    )}
                  </div>
                </div>

                {/* Review section */}
                {appointment.status === 'completed' && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
                    {!appointment.hasReviewed ? (
                      <>
                        <button
                          onClick={() => setReviewingId(reviewingId === appointment.id ? null : appointment.id)}
                          data-testid={`review-button-${index}`}
                          style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 999, padding: '5px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: mono }}
                        >
                          {reviewingId === appointment.id ? '✕ Band Karein' : '⭐ Review Dein'}
                        </button>
                        {reviewingId === appointment.id && (
                          <ReviewForm
                            doctorId={appointment.doctor_id}
                            appointmentId={appointment.id}
                            onSuccess={() => { setReviewingId(null); fetchAppointments(); }}
                          />
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: T.green, fontFamily: mono }}>✓ Review De Diya</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}