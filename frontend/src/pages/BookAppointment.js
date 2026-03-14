import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import ReviewList from '@/components/ReviewList';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function formatDateStr(date) { return date.toISOString().split('T')[0]; }
function getDayName(date) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
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

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const w = useWindowWidth();
  const isMobile = w < 640;
  const isTablet = w < 900;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [calYear, setCalYear]           = useState(today.getFullYear());
  const [calMonth, setCalMonth]         = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [reason, setReason]             = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  const reasonError = reasonTouched && reason.trim().length === 0;
  const isReady = selectedDate && selectedTime && reason.trim().length > 0;

  useEffect(() => { fetchDoctorProfile(); }, []);
  useEffect(() => { if (selectedDate) fetchAvailability(); }, [selectedDate]);

  const fetchDoctorProfile = async () => {
    try {
      const res = await axios.get(`${API}/doctor/profile`);
      setDoctorProfile(res.data);
    } catch { toast.error('Failed to fetch doctor profile'); }
  };

  const fetchAvailability = async () => {
    try {
      const dateStr = formatDateStr(selectedDate);
      const res = await axios.get(`${API}/doctor/availability?date=${dateStr}`);
      setAvailableSlots(res.data.filter(s => s.available));
      setSelectedTime('');
    } catch { toast.error('Failed to fetch availability'); }
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const handleDateClick = (day) => {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d < today) return;
    setSelectedDate(d);
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setReasonTouched(true);
    if (!selectedTime) { toast.error('Please select a time slot'); return; }
    if (!reason.trim()) { toast.error('Please describe your health concern'); return; }
    if (!doctorProfile) { toast.error('Doctor profile not loaded yet'); return; }
    if (!user?.id) { toast.error('Please login again'); return; }

    setLoading(true);
    try {
      const dateStr = formatDateStr(selectedDate);
      const appointmentData = { patient_id:user.id, date:dateStr, time:selectedTime, consultation_type:consultationType, reason };
      const response = await axios.post(`${API}/appointments`, appointmentData);
      const appointment = response.data;
      const orderData = { amount:doctorProfile.consultation_fee, currency:'INR', appointment_id:appointment.id };
      const orderResponse = await axios.post(`${API}/payments/create-order`, orderData);

      if (orderResponse.data.test_mode) {
        toast.success('Test Mode: Simulating payment...');
        await axios.post(`${API}/payments/verify`, { appointment_id:appointment.id, payment_id:`pay_test_${Date.now()}`, test_mode:true });
        toast.success('Appointment booked successfully!');
        setTimeout(() => navigate('/patient/dashboard'), 800);
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) { toast.error('Razorpay failed to load.'); return; }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        order_id: orderResponse.data.id,
        name: 'HealthLine',
        description: 'Consultation Fee',
        handler: async function (rzpResponse) {
          try {
            await axios.post(`${API}/payments/verify`, { appointment_id:appointment.id, payment_id:rzpResponse.razorpay_payment_id, test_mode:false });
            toast.success('Appointment booked successfully!');
            setTimeout(() => navigate('/patient/dashboard'), 800);
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { name:user.full_name, email:user.email },
        theme: { color:'#0F766E' },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create appointment');
    } finally { setLoading(false); }
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDayOfMonth(calYear, calMonth);
  const calCells    = Array.from({ length:firstDay }, () => null)
    .concat(Array.from({ length:daysInMonth }, (_, i) => i + 1));

  const isTodayCell = (day) => {
    if (!day) return false;
    return new Date(calYear, calMonth, day).toDateString() === today.toDateString();
  };
  const isSelectedCell = (day) => {
    if (!day || !selectedDate) return false;
    return new Date(calYear, calMonth, day).toDateString() === selectedDate.toDateString();
  };
  const isPastCell = (day) => {
    if (!day) return false;
    const d = new Date(calYear, calMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const teal = '#1D9E75';
  const tealDark = '#0F6E56';
  const tealLight = '#E1F5EE';

  const getCalDayStyle = (day) => {
    const base = { width:isMobile?26:29, height:isMobile?26:29, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?11:12, margin:'0 auto', cursor:'pointer', color:'#6b7280' };
    if (!day) return { ...base, cursor:'default' };
    if (isPastCell(day)) return { ...base, color:'#e5e7eb', cursor:'default' };
    if (isSelectedCell(day)) return { ...base, background:teal, color:'#fff', border:'none' };
    if (isTodayCell(day)) return { ...base, color:teal, fontWeight:600, border:`2px solid ${teal}` };
    return base;
  };

  const nextSlot = availableSlots[0];
  const slotCols = isMobile ? 2 : 4;

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", maxWidth:960, margin:'0 auto', padding:isMobile?'1rem 0.875rem 2rem':'1.5rem 1.25rem 3rem', color:'#111' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' }}>
        <button style={{ width:34, height:34, borderRadius:'50%', border:'0.5px solid #d1d5db', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'#6b7280' }}
          onClick={() => navigate('/patient/dashboard')}>←</button>
        <span style={{ fontSize:isMobile?17:20, fontWeight:500, color:tealDark }}>Book appointment</span>
      </div>

      {/* Progress bar */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:'1.5rem' }}>
        {['Doctor','Schedule','Confirm','Payment'].map((label, i) => (
          <div key={label} style={{ display:'flex', flex:1, alignItems:'center' }}>
            {i > 0 && <div style={{ flex:1, height:1.5, background:i<=1?teal:'#e5e7eb', marginTop:-15 }} />}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, ...(i===0?{background:teal,color:'#fff'}:i===1?{background:teal,color:'#fff',boxShadow:'0 0 0 4px rgba(29,158,117,0.15)'}:{background:'#f3f4f6',color:'#9ca3af',border:'0.5px solid #e5e7eb'}) }}>
                {i === 0 ? '✓' : i + 1}
              </div>
              {!isMobile && <span style={{ fontSize:11, marginTop:5, color:i===1?tealDark:'#9ca3af', fontWeight:i===1?500:400, textAlign:'center' }}>{label}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Doctor card */}
      {doctorProfile && (
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:50, height:50, borderRadius:'50%', background:tealLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:500, color:tealDark, flexShrink:0 }}>
            {doctorProfile.full_name?.charAt(0) || 'D'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:500, color:'#111', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {doctorProfile.full_name?.startsWith('Dr') ? doctorProfile.full_name : `Dr. ${doctorProfile.full_name}`}
            </div>
            <div style={{ fontSize:12, color:'#6b7280', marginBottom:7 }}>{doctorProfile.specialization || 'General Physician'}</div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, padding:'3px 9px', borderRadius:999, fontWeight:500, background:tealLight, color:tealDark }}>₹{doctorProfile.consultation_fee} fee</span>
              <span style={{ fontSize:11, padding:'3px 9px', borderRadius:999, fontWeight:500, background:'#E6F1FB', color:'#0C447C' }}>✓ Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Calendar + Consult — stack on mobile */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile||isTablet?'1fr':'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.2rem 1.4rem' }}>
          <div style={{ fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.9rem' }}>Select date</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.85rem' }}>
            <button style={{ width:26, height:26, borderRadius:'50%', border:'0.5px solid #e5e7eb', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#6b7280', fontSize:12 }} onClick={prevMonth}>‹</button>
            <span style={{ fontSize:14, fontWeight:500, color:'#111' }}>{MONTHS[calMonth]} {calYear}</span>
            <button style={{ width:26, height:26, borderRadius:'50%', border:'0.5px solid #e5e7eb', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#6b7280', fontSize:12 }} onClick={nextMonth}>›</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:isMobile?2:3, textAlign:'center' }}>
            {DAYS_SHORT.map(d => <div key={d} style={{ fontSize:10, color:'#d1d5db', fontWeight:500, padding:'3px 0' }}>{d}</div>)}
            {calCells.map((day, idx) => (
              <div key={idx} onClick={() => day && handleDateClick(day)} style={getCalDayStyle(day)}>{day || ''}</div>
            ))}
          </div>
        </div>

        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.2rem 1.4rem' }}>
          <div style={{ fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.9rem' }}>Consultation type</div>
          {[
            { id:'video', label:'Video call', sub:`Face-to-face · ₹${doctorProfile?.consultation_fee||''}`, Icon:Video },
            { id:'chat',  label:'Chat',        sub:`Text-based · ₹${doctorProfile?.consultation_fee||''}`,  Icon:MessageCircle },
          ].map(opt => (
            <div key={opt.id} onClick={() => setConsultationType(opt.id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:consultationType===opt.id?`1.5px solid ${teal}`:'0.5px solid #e5e7eb', borderRadius:8, cursor:'pointer', marginBottom:8, background:consultationType===opt.id?'#f2fbf8':'#fff' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:opt.id==='video'?tealLight:'#E6F1FB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <opt.Icon size={16} color={opt.id==='video'?'#085041':'#0C447C'} />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'#111' }}>{opt.label}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>{opt.sub}</div>
              </div>
              <div style={{ marginLeft:'auto', width:15, height:15, borderRadius:'50%', border:consultationType===opt.id?`none`:'2px solid #d1d5db', flexShrink:0, background:consultationType===opt.id?teal:'transparent', boxShadow:consultationType===opt.id?`inset 0 0 0 3px #fff`:undefined }} />
            </div>
          ))}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.9rem' }}>
              Reason for visit&nbsp;<span style={{ color:'#E24B4A', fontSize:12 }}>*</span>
            </div>
            <textarea maxLength={200} value={reason} onChange={e => setReason(e.target.value)} onBlur={() => setReasonTouched(true)}
              placeholder="Describe your health concern briefly..."
              style={{ width:'100%', border:reasonError?'1px solid #E24B4A':'0.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:13, resize:'none', height:78, fontFamily:'inherit', background:reasonError?'#fff9f9':'#fff', color:'#111', outline:'none', boxSizing:'border-box' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
              {reasonError ? <span style={{ fontSize:11, color:'#E24B4A' }}>This field is required</span> : <span />}
              <span style={{ fontSize:11, color:'#d1d5db' }}>{reason.length} / 200</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div style={{ display:'flex', alignItems:'center', gap:8, background:tealLight, borderRadius:8, padding:'9px 13px', marginBottom:'1rem', flexWrap:'wrap' }}>
        <span style={{ fontSize:14 }}>🕐</span>
        <span style={{ fontSize:12, color:tealDark, fontWeight:500 }}>Asia/Kolkata (IST, UTC+5:30)</span>
        <span style={{ fontSize:11, color:teal, marginLeft:'auto' }}>{isMobile?'Local timezone':'All times shown in your local timezone'}</span>
      </div>

      {/* Slots */}
      <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.2rem 1.4rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.9rem', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Slots{selectedDate ? ` · ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}` : ''}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:isMobile?6:10, flexWrap:'wrap' }}>
            {nextSlot && <span style={{ fontSize:11, background:'#FAEEDA', color:'#633806', padding:'3px 9px', borderRadius:999, fontWeight:500 }}>Next: {nextSlot.time}</span>}
            {!isMobile && (
              <div style={{ display:'flex', gap:10 }}>
                {[{color:'#1D9E75',label:'Selected'},{color:'#f3f4f6',border:'0.5px solid #e5e7eb',label:'Booked'},{color:'#fff',border:'1.5px solid #1D9E75',label:'Next'}].map(l => (
                  <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:l.color, border:l.border||'none' }} />
                    <span style={{ fontSize:11, color:'#9ca3af' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {!selectedDate ? (
          <p style={{ fontSize:13, color:'#9ca3af' }}>Please select a date first</p>
        ) : availableSlots.length === 0 ? (
          <p style={{ fontSize:13, color:'#9ca3af' }}>No available slots for this date</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${slotCols},1fr)`, gap:8 }}>
            {availableSlots.map((slot, i) => {
              const isSel  = selectedTime === slot.time;
              const isNext = i === 0 && selectedTime === '';
              return (
                <button key={i} type="button" onClick={() => setSelectedTime(slot.time)}
                  style={{ padding:'11px 4px', border:isSel?`none`:isNext?`1.5px solid ${teal}`:'0.5px solid #e5e7eb', borderRadius:999, background:isSel?teal:'#fff', color:isSel?'#fff':'#111', fontSize:isMobile?12:13, textAlign:'center', cursor:'pointer', position:'relative', fontFamily:'inherit', fontWeight:isSel?500:400 }}>
                  {slot.time}
                  {isNext && <span style={{ position:'absolute', top:-3, right:8, width:7, height:7, borderRadius:'50%', background:teal }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedDate && selectedTime && (
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.2rem 1.4rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.9rem' }}>Appointment summary</div>
          {[
            { label:'Doctor', value:doctorProfile?(doctorProfile.full_name?.startsWith('Dr') ? doctorProfile.full_name : `Dr. ${doctorProfile.full_name}`):'—' },
            { label:'Date', value:`${getDayName(selectedDate)}, ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` },
            { label:'Time', value:selectedTime, tz:true },
            { label:'Type', value:consultationType==='video'?'Video consultation':'Chat consultation' },
            { label:'Fee', value:doctorProfile?`₹${doctorProfile.consultation_fee}`:'—', fee:true },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'0.5px solid #f3f4f6', flexWrap:'wrap', gap:4 }}>
              <span style={{ fontSize:12, color:'#9ca3af' }}>{row.label}</span>
              <span style={{ fontSize:row.fee?16:13, fontWeight:500, color:row.fee?tealDark:'#111' }}>
                {row.value}{row.tz && <span style={{ fontSize:11, color:teal }}> IST</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Confirm */}
      <button onClick={handleBookAppointment} disabled={!isReady||loading}
        style={{ width:'100%', background:teal, color:'#fff', border:'none', borderRadius:999, padding:15, fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:'1.5rem', opacity:!isReady||loading?0.45:1 }}>
        {loading?'Processing...':'Confirm appointment →'}
      </button>

      {/* Divider */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem' }}>
        <div style={{ flex:1, height:0.5, background:'#e5e7eb' }} />
        <span style={{ fontSize:11, color:'#d1d5db', whiteSpace:'nowrap' }}>Additional information</span>
        <div style={{ flex:1, height:0.5, background:'#e5e7eb' }} />
      </div>

      {/* Reschedule */}
      <div onClick={() => { setSelectedDate(null); setSelectedTime(''); setAvailableSlots([]); window.scrollTo({ top:0, behavior:'smooth' }); }}
        style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#185FA5', cursor:'pointer', padding:'11px 1.2rem', background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, marginBottom:'1rem' }}>
        <span>↺</span><span>Need to reschedule? Change your date or time</span>
      </div>

      {/* Tips + Policy — stack on mobile */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.2rem 1.4rem' }}>
          <div style={{ fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.9rem' }}>Before your appointment</div>
          {['Email + SMS reminder sent 1 hr before','Keep your video link ready','Have reports or documents handy','Join 2 minutes early for tech check']
            .map(t => <div key={t} style={{ fontSize:12, color:'#6b7280', padding:'5px 0', borderBottom:'0.5px solid #f3f4f6', lineHeight:1.5 }}>{t}</div>)}
        </div>
        <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.2rem 1.4rem' }}>
          <div style={{ fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.9rem' }}>Cancellation policy</div>
          {['Free cancellation up to 2 hrs before','50% refund if cancelled within 2 hrs','No refund for no-shows']
            .map(p => <div key={p} style={{ fontSize:12, color:'#6b7280', padding:'5px 0', borderBottom:'0.5px solid #f3f4f6', lineHeight:1.5 }}>{p}</div>)}
        </div>
      </div>

      {/* Reviews */}
      {doctorProfile && (
        <div style={{ marginTop:'2rem', borderTop:'0.5px solid #e5e7eb', paddingTop:'2rem' }}>
          <ReviewList doctorId={doctorProfile.id} />
        </div>
      )}
    </div>
  );
}