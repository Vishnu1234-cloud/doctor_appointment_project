import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, LogOut, Video, MessageCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const font = "'Plus Jakarta Sans','Segoe UI',sans-serif";
const mono = "'JetBrains Mono','Courier New',monospace";

const T = {
  pageBg:'#f8f7ff',cardBg:'#ffffff',cardBorder:'#e8e4ff',navBg:'#ffffff',navBorder:'#e8e4ff',
  textPri:'#1e1b4b',textSec:'#6b7280',textMut:'#9ca3af',divider:'#f3f4f6',
  primary:'#4f46e5',primaryDim:'#ede9fe',primaryBdr:'#c4b5fd',
  green:'#059669',greenDim:'#d1fae5',greenBdr:'#a7f3d0',
  amber:'#d97706',amberDim:'#fef3c7',amberBdr:'#fde68a',
  red:'#dc2626',redDim:'#fee2e2',redBdr:'#fca5a5',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function useWindowWidth() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const w = useWindowWidth();
  const isMobile = w < 640;
  const isTablet = w < 768;

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`);
      setAppointments(response.data);
    } catch (error) { toast.error('Failed to fetch appointments'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await axios.put(`${API}/appointments/${appointmentId}/status`, { status });
      toast.success('Status updated successfully');
      fetchAppointments();
    } catch (error) { toast.error('Failed to update status'); }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments     = appointments.filter(a => a.date === todayStr);
  const pendingAppointments   = appointments.filter(a => a.status === 'pending');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const monthEarnings = completedAppointments.length * 100;

  const statusStyle = (s) => {
    switch(s) {
      case 'confirmed': return { color:T.green,   background:T.greenDim,   border:`1px solid ${T.greenBdr}` };
      case 'pending':   return { color:T.amber,   background:T.amberDim,   border:`1px solid ${T.amberBdr}` };
      case 'completed': return { color:T.primary, background:T.primaryDim, border:`1px solid ${T.primaryBdr}` };
      case 'cancelled': return { color:T.red,     background:T.redDim,     border:`1px solid ${T.redBdr}` };
      default:          return { color:T.textSec, background:T.pageBg,     border:`1px solid ${T.cardBorder}` };
    }
  };

  return (
    <div style={{ background:T.pageBg, minHeight:'100vh', fontFamily:font, color:T.textPri }} data-testid="doctor-dashboard">

      {/* Header */}
      <header style={{ background:T.navBg, borderBottom:`1px solid ${T.navBorder}`, padding:'0 1.25rem', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:960, margin:'0 auto', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.3px', color:T.textPri, margin:0 }} data-testid="dashboard-logo">
            Health<span style={{ color:T.primary }}>Line</span>
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:isMobile?6:10 }}>
            {!isMobile && (
              <div style={{ fontSize:11, background:T.greenDim, color:T.green, border:`1px solid ${T.greenBdr}`, padding:'4px 10px', borderRadius:6, fontFamily:mono }}>● online</div>
            )}
            {!isMobile && (
              <span style={{ fontSize:13, color:T.textSec, fontFamily:mono }} data-testid="doctor-name">{user?.full_name}</span>
            )}
            {!isMobile && (
              <button onClick={() => navigate('/doctor/profile-setup')}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:999, border:`1px solid ${T.cardBorder}`, background:'transparent', color:T.textSec, fontSize:11, fontFamily:mono, cursor:'pointer' }}>
                👤 Profile
              </button>
            )}
            <button onClick={handleLogout} data-testid="logout-button"
              style={{ display:'flex', alignItems:'center', gap:5, padding:isMobile?'6px 10px':'6px 14px', borderRadius:999, border:`1px solid ${T.cardBorder}`, background:'transparent', color:T.textSec, fontSize:12, fontFamily:mono, cursor:'pointer' }}>
              <LogOut size={13} />{!isMobile && ' Logout'}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:960, margin:'0 auto', padding:isMobile?'1.25rem 1rem 2rem':'2rem 1.5rem 3rem' }}>

        {/* Greeting */}
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ fontSize:11, color:T.textMut, fontFamily:mono, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
          <h2 style={{ fontSize:isMobile?20:24, fontWeight:700, letterSpacing:'-0.4px', color:T.textPri, margin:0 }} data-testid="dashboard-title">
            Good {getGreeting()}, <span style={{ color:T.primary }}>Dr. {user?.full_name?.split(' ')[0]}</span> 🩺
          </h2>
          <p style={{ fontSize:13, color:T.textMut, marginTop:4, fontFamily:mono }} data-testid="dashboard-subtitle">
            Manage your appointments and consultations
          </p>
        </div>

        {/* Stats — 2x2 on mobile, 4 cols on desktop */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:isMobile?8:10, marginBottom:'1.25rem' }}>
          {[
            { n:todayAppointments.length,     l:'Today',     c:T.primary, testId:'stat-today'     },
            { n:pendingAppointments.length,   l:'Pending',   c:T.amber,   testId:'stat-pending'   },
            { n:completedAppointments.length, l:'Completed', c:T.green,   testId:'stat-completed' },
            { n:appointments.length,          l:'Total',     c:T.textPri, testId:'stat-total'     },
          ].map(s => (
            <div key={s.l} data-testid={s.testId}
              style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:isMobile?'0.7rem 0.8rem':'0.9rem 1.1rem' }}>
              <div style={{ fontSize:isMobile?22:26, fontWeight:700, fontFamily:mono, color:s.c, marginBottom:4 }}>{s.n}</div>
              <div style={{ fontSize:isMobile?9:10, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:mono }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Schedule + Earnings — stack on mobile */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':isTablet?'1fr':'1fr 1fr', gap:10, marginBottom:'1.5rem' }}>
          <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:'1rem 1.2rem' }}>
            <div style={{ fontSize:10, fontWeight:600, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:mono, marginBottom:'0.85rem' }}>Weekly schedule</div>
            {[
              { day:'Mon–Fri',  time:'6:00–8:00 PM' },
              { day:'Saturday', time:'6:00–8:00 PM' },
              { day:'Sunday',   time:'Off', off:true },
            ].map(r => (
              <div key={r.day} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${T.divider}`, fontSize:12 }}>
                <span style={{ color:T.textSec, fontFamily:mono }}>{r.day}</span>
                <span style={{ color:r.off?T.textMut:T.textPri, fontFamily:mono, fontWeight:r.off?400:500 }}>{r.time}</span>
              </div>
            ))}
          </div>
          <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:12, padding:'1rem 1.2rem' }}>
            <div style={{ fontSize:10, fontWeight:600, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:mono, marginBottom:'0.85rem' }}>This month</div>
            <div style={{ fontSize:isMobile?26:32, fontWeight:700, color:T.green, fontFamily:mono, margin:'8px 0 4px' }}>₹{monthEarnings.toLocaleString()}</div>
            <div style={{ fontSize:11, color:T.textMut, fontFamily:mono }}>from {completedAppointments.length} consultations</div>
          </div>
        </div>

        {/* Appointments */}
        <div style={{ fontSize:10, fontWeight:600, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:mono, marginBottom:'0.75rem' }}>All appointments</div>
        <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:16, overflow:'hidden' }} data-testid="appointments-card">
          {loading ? (
            <p style={{ textAlign:'center', padding:'3rem', color:T.textMut, fontFamily:mono, fontSize:13 }} data-testid="loading-text">Loading...</p>
          ) : appointments.length === 0 ? (
            <p style={{ textAlign:'center', padding:'3rem', color:T.textMut, fontFamily:mono, fontSize:13 }} data-testid="no-appointments">No appointments yet</p>
          ) : (
            appointments.map((appointment, index) => (
              <div key={appointment.id} data-testid={`appointment-${index}`}
                style={{ padding:isMobile?'0.85rem 1rem':'1rem 1.25rem', borderBottom:index<appointments.length-1?`1px solid ${T.divider}`:'none', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:appointment.consultation_type==='video'?T.primaryDim:T.greenDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {appointment.consultation_type==='video' ? <Video size={14} color={T.primary} /> : <MessageCircle size={14} color={T.green} />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:T.textPri, margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} data-testid={`appointment-reason-${index}`}>
                    {appointment.reason || 'Consultation'}
                  </p>
                  <p style={{ fontSize:11, color:T.textSec, fontFamily:mono, margin:0 }} data-testid={`appointment-datetime-${index}`}>
                    {appointment.date} at {appointment.time}
                  </p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, flexWrap:isMobile?'wrap':'nowrap', justifyContent:'flex-end' }}>
                  <span data-testid={`appointment-status-${index}`}
                    style={{ fontSize:10, padding:'3px 8px', borderRadius:6, fontFamily:mono, fontWeight:500, whiteSpace:'nowrap', ...statusStyle(appointment.status) }}>
                    {appointment.status}
                  </span>
                  {appointment.status==='pending' && (
                    <button onClick={() => handleUpdateStatus(appointment.id, 'confirmed')} data-testid={`confirm-button-${index}`}
                      style={{ background:T.green, color:'#fff', border:'none', borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:mono }}>Confirm</button>
                  )}
                  {appointment.status==='confirmed' && (
                    <>
                      <button onClick={() => navigate(`/consultation/${appointment.id}`)} data-testid={`join-button-${index}`}
                        style={{ background:T.primary, color:'#fff', border:'none', borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:mono }}>Join</button>
                      {!isMobile && (
                        <button onClick={() => navigate(`/doctor/prescription/${appointment.id}`)} data-testid={`prescription-button-${index}`}
                          style={{ background:'transparent', color:T.primary, border:`1px solid ${T.primaryBdr}`, borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:mono }}>Rx</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}