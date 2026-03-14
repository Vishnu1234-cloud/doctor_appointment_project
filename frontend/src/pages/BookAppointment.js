import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, MessageCircle } from 'lucide-react';
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

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function formatDateStr(date) { return date.toISOString().split('T')[0]; }
function getDayName(date) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [calYear, setCalYear]       = useState(today.getFullYear());
  const [calMonth, setCalMonth]     = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime]   = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [reason, setReason]         = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [loading, setLoading]       = useState(false);
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
      const appointmentData = {
        patient_id: user.id,
        date: dateStr,
        time: selectedTime,
        consultation_type: consultationType,
        reason,
      };

      const response = await axios.post(`${API}/appointments`, appointmentData);
      const appointment = response.data;

      const orderData = {
        amount: doctorProfile.consultation_fee,
        currency: 'INR',
        appointment_id: appointment.id,
      };

      const orderResponse = await axios.post(`${API}/payments/create-order`, orderData);

      if (orderResponse.data.test_mode) {
        toast.success('Test Mode: Simulating payment...');
        await axios.post(`${API}/payments/verify`, {
          appointment_id: appointment.id,
          payment_id: `pay_test_${Date.now()}`,
          test_mode: true,
        });
        toast.success('Appointment booked successfully!');
        setTimeout(() => navigate('/patient/dashboard'), 800);
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) { toast.error('Razorpay failed to load. Check internet and try again.'); return; }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        order_id: orderResponse.data.id,
        name: 'HealthLine',
        description: 'Consultation Fee',
        handler: async function (rzpResponse) {
          try {
            await axios.post(`${API}/payments/verify`, {
              appointment_id: appointment.id,
              payment_id: rzpResponse.razorpay_payment_id,
              test_mode: false,
            });
            toast.success('Appointment booked successfully!');
            setTimeout(() => navigate('/patient/dashboard'), 800);
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { name: user.full_name, email: user.email },
        theme: { color: '#0F766E' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  // Calendar rendering
  const daysInMonth   = getDaysInMonth(calYear, calMonth);
  const firstDay      = getFirstDayOfMonth(calYear, calMonth);
  const calCells      = Array.from({ length: firstDay }, () => null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const isTodayCell = (day) => {
    if (!day) return false;
    const d = new Date(calYear, calMonth, day);
    return d.toDateString() === today.toDateString();
  };
  const isSelectedCell = (day) => {
    if (!day || !selectedDate) return false;
    return new Date(calYear, calMonth, day).toDateString() === selectedDate.toDateString();
  };
  const isPastCell = (day) => {
    if (!day) return false;
    const d = new Date(calYear, calMonth, day);
    d.setHours(0,0,0,0);
    return d < today;
  };

  const nextSlot = availableSlots[0];

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => navigate('/patient/dashboard')}>←</button>
        <span style={S.pageTitle}>Book appointment</span>
      </div>

      {/* Progress bar */}
      <div style={S.progress}>
        {['Doctor','Schedule','Confirm','Payment'].map((label, i) => (
          <div key={label} style={S.stepWrap}>
            {i > 0 && <div style={{...S.stepLine, ...(i <= 1 ? S.stepLineDone : {})}} />}
            <div style={S.stepCol}>
              <div style={{...S.stepCirc, ...(i===0 ? S.sDone : i===1 ? S.sActive : S.sIdle)}}>
                {i === 0 ? '✓' : i + 1}
              </div>
              <span style={{...S.stepLbl, ...(i===1 ? S.stepLblActive : {})}}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Doctor card */}
      {doctorProfile && (
        <div style={S.docCard}>
          <div style={S.docAvatar}>
            {doctorProfile.full_name?.charAt(0) || 'D'}
          </div>
          <div style={S.docInfo}>
            <div style={S.docName}>Dr. {doctorProfile.full_name}</div>
            <div style={S.docSpec}>
              {doctorProfile.specialization || 'General Physician'}
            </div>
            <div style={S.docBadges}>
              <span style={{...S.badge, ...S.badgeGreen}}>
                ₹{doctorProfile.consultation_fee} fee
              </span>
              <span style={{...S.badge, ...S.badgeBlue}}>✓ Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Calendar + Consult type */}
      <div style={S.twoCol}>

        {/* Calendar */}
        <div style={S.card}>
          <div style={S.cardTitle}>Select date</div>
          <div style={S.calNav}>
            <button style={S.calArr} onClick={prevMonth}>‹</button>
            <span style={S.calMonth}>{MONTHS[calMonth]} {calYear}</span>
            <button style={S.calArr} onClick={nextMonth}>›</button>
          </div>
          <div style={S.calGrid}>
            {DAYS_SHORT.map(d => (
              <div key={d} style={S.calDayName}>{d}</div>
            ))}
            {calCells.map((day, idx) => (
              <div
                key={idx}
                onClick={() => day && handleDateClick(day)}
                style={{
                  ...S.calDay,
                  ...(isPastCell(day) ? S.calDayPast : {}),
                  ...(isTodayCell(day) ? S.calDayToday : {}),
                  ...(isSelectedCell(day) && !isTodayCell(day) ? S.calDaySel : {}),
                  ...(!day ? { cursor: 'default' } : {}),
                }}
              >
                {day || ''}
              </div>
            ))}
          </div>
        </div>

        {/* Consult type + Reason */}
        <div style={S.card}>
          <div style={S.cardTitle}>Consultation type</div>
          {[
            { id: 'video', label: 'Video call',  sub: `Face-to-face · ₹${doctorProfile?.consultation_fee || ''}`, Icon: Video },
            { id: 'chat',  label: 'Chat',         sub: `Text-based · ₹${doctorProfile?.consultation_fee || ''}`,  Icon: MessageCircle },
          ].map(opt => (
            <div
              key={opt.id}
              onClick={() => setConsultationType(opt.id)}
              style={{...S.consultOpt, ...(consultationType===opt.id ? S.consultOptOn : {})}}
            >
              <div style={{
                ...S.consultIcon,
                background: opt.id==='video' ? '#E1F5EE' : '#E6F1FB',
              }}>
                <opt.Icon size={16} color={opt.id==='video' ? '#085041' : '#0C447C'} />
              </div>
              <div>
                <div style={S.consultTitle}>{opt.label}</div>
                <div style={S.consultSub}>{opt.sub}</div>
              </div>
              <div style={{...S.radio, ...(consultationType===opt.id ? S.radioOn : {})}} />
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div style={S.cardTitle}>
              Reason for visit&nbsp;
              <span style={S.requiredStar}>*</span>
            </div>
            <textarea
              maxLength={200}
              value={reason}
              onChange={e => setReason(e.target.value)}
              onBlur={() => setReasonTouched(true)}
              placeholder="Describe your health concern briefly..."
              style={{...S.textarea, ...(reasonError ? S.textareaError : {})}}
            />
            <div style={S.charCountRow}>
              {reasonError
                ? <span style={S.errorMsg}>This field is required</span>
                : <span />}
              <span style={S.charCount}>{reason.length} / 200</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timezone banner */}
      <div style={S.tzBar}>
        <span style={{ fontSize: 14 }}>🕐</span>
        <span style={S.tzText}>Asia/Kolkata (IST, UTC+5:30)</span>
        <span style={S.tzSub}>All times shown in your local timezone</span>
      </div>

      {/* Time slots */}
      <div style={S.card}>
        <div style={S.slotsHeader}>
          <div style={S.cardTitle}>
            Available time slots{selectedDate ? ` · ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}` : ''}
          </div>
          <div style={S.slotHeaderRight}>
            {nextSlot && (
              <span style={S.nextTag}>Next available: {nextSlot.time}</span>
            )}
            <div style={S.legend}>
              <LegendDot color="#1D9E75" label="Selected" />
              <LegendDot color="#f3f4f6" border="0.5px solid #e5e7eb" label="Booked" />
              <LegendDot color="#fff" border="1.5px solid #1D9E75" label="Next" />
            </div>
          </div>
        </div>

        {!selectedDate ? (
          <p style={S.emptyMsg}>Please select a date first</p>
        ) : availableSlots.length === 0 ? (
          <p style={S.emptyMsg}>No available slots for this date</p>
        ) : (
          <div style={S.slotGrid}>
            {availableSlots.map((slot, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedTime(slot.time)}
                style={{
                  ...S.slotBtn,
                  ...(selectedTime === slot.time ? S.slotSel : {}),
                  ...(i === 0 && selectedTime !== slot.time ? S.slotNext : {}),
                }}
              >
                {slot.time}
                {i === 0 && <span style={S.nextDot} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Appointment summary */}
      {selectedDate && selectedTime && (
        <div style={S.card}>
          <div style={S.cardTitle}>Appointment summary</div>
          {[
            { label: 'Doctor',           value: doctorProfile ? `Dr. ${doctorProfile.full_name}` : '—' },
            { label: 'Date',             value: `${getDayName(selectedDate)}, ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` },
            { label: 'Time',             value: selectedTime, tz: true },
            { label: 'Type',             value: consultationType === 'video' ? 'Video consultation' : 'Chat consultation' },
            { label: 'Consultation fee', value: doctorProfile ? `₹${doctorProfile.consultation_fee}` : '—', fee: true },
          ].map(row => (
            <div key={row.label} style={S.summaryRow}>
              <span style={S.summaryLabel}>{row.label}</span>
              <span style={{...S.summaryValue, ...(row.fee ? S.summaryFee : {})}}>
                {row.value}
                {row.tz && <span style={S.tzPill}> IST</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleBookAppointment}
        disabled={!isReady || loading}
        style={{...S.confirmBtn, ...(!isReady || loading ? S.confirmBtnDisabled : {})}}
      >
        {loading ? 'Processing...' : 'Confirm appointment →'}
      </button>

      {/* Divider */}
      <div style={S.divider}>
        <div style={S.divLine} /><span style={S.divText}>Additional information</span><div style={S.divLine} />
      </div>

      {/* Reschedule */}
      <div style={S.reschedule}>
        <span>↺</span>
        <span>Need to reschedule? Change your date or time</span>
      </div>

      {/* Tips + Policy */}
      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={S.cardTitle}>Before your appointment</div>
          {['Email + SMS reminder sent 1 hr before','Keep your video link ready','Have reports or documents handy','Join 2 minutes early for tech check']
            .map(t => <div key={t} style={S.listItem}>{t}</div>)}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Cancellation policy</div>
          {['Free cancellation up to 2 hrs before','50% refund if cancelled within 2 hrs','No refund for no-shows']
            .map(p => <div key={p} style={S.listItem}>{p}</div>)}
        </div>
      </div>

      {/* Reviews */}
      {doctorProfile && (
        <div style={{ marginTop: '2rem', borderTop: '0.5px solid #e5e7eb', paddingTop: '2rem' }}>
          <ReviewList doctorId={doctorProfile.id} />
        </div>
      )}

    </div>
  );
}

function LegendDot({ color, border, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:color, border: border||'none' }} />
      <span style={{ fontSize:11, color:'#9ca3af' }}>{label}</span>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────
const teal = '#1D9E75';
const tealDark = '#0F6E56';
const tealLight = '#E1F5EE';

const S = {
  page: { fontFamily:"'DM Sans','Segoe UI',sans-serif", maxWidth:960, margin:'0 auto', padding:'1.5rem 1.25rem 3rem', color:'#111' },

  header: { display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' },
  backBtn: { width:34, height:34, borderRadius:'50%', border:'0.5px solid #d1d5db', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'#6b7280' },
  pageTitle: { fontSize:20, fontWeight:500, color:tealDark },

  progress: { display:'flex', alignItems:'center', marginBottom:'1.5rem' },
  stepWrap: { display:'flex', flex:1, alignItems:'center' },
  stepCol:  { display:'flex', flexDirection:'column', alignItems:'center', flex:1 },
  stepLine: { flex:1, height:1.5, background:'#e5e7eb', marginTop:-15 },
  stepLineDone: { background:teal },
  stepCirc: { width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500 },
  sDone:   { background:teal, color:'#fff' },
  sActive: { background:teal, color:'#fff', boxShadow:'0 0 0 4px rgba(29,158,117,0.15)' },
  sIdle:   { background:'#f3f4f6', color:'#9ca3af', border:'0.5px solid #e5e7eb' },
  stepLbl: { fontSize:11, marginTop:5, color:'#9ca3af', textAlign:'center' },
  stepLblActive: { color:tealDark, fontWeight:500 },

  docCard: { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:14 },
  docAvatar: { width:50, height:50, borderRadius:'50%', background:tealLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:500, color:tealDark, flexShrink:0 },
  docInfo: { flex:1 },
  docName: { fontSize:15, fontWeight:500, color:'#111', marginBottom:2 },
  docSpec: { fontSize:12, color:'#6b7280', marginBottom:7 },
  docBadges: { display:'flex', gap:7 },
  badge: { fontSize:11, padding:'3px 9px', borderRadius:999, fontWeight:500 },
  badgeGreen: { background:tealLight, color:tealDark },
  badgeBlue:  { background:'#E6F1FB', color:'#0C447C' },

  twoCol: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' },
  card: { background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.2rem 1.4rem', marginBottom:'1rem' },
  cardTitle: { fontSize:11, fontWeight:500, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.9rem' },

  calNav: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.85rem' },
  calMonth: { fontSize:14, fontWeight:500, color:'#111' },
  calArr: { width:26, height:26, borderRadius:'50%', border:'0.5px solid #e5e7eb', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#6b7280', fontSize:12 },
  calGrid: { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, textAlign:'center' },
  calDayName: { fontSize:10, color:'#d1d5db', fontWeight:500, padding:'3px 0' },
  calDay: { width:29, height:29, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, margin:'0 auto', cursor:'pointer', color:'#6b7280' },
  calDayPast:  { color:'#e5e7eb', cursor:'default' },
  calDayToday: { background:teal, color:'#fff', fontWeight:500 },
  calDaySel:   { background:teal, color:'#fff' },

  consultOpt: { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'0.5px solid #e5e7eb', borderRadius:8, cursor:'pointer', marginBottom:8 },
  consultOptOn: { border:`1.5px solid ${teal}`, background:'#f2fbf8' },
  consultIcon: { width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  consultTitle: { fontSize:13, fontWeight:500, color:'#111' },
  consultSub:   { fontSize:11, color:'#9ca3af' },
  radio: { marginLeft:'auto', width:15, height:15, borderRadius:'50%', border:'2px solid #d1d5db', flexShrink:0 },
  radioOn: { borderColor:teal, background:teal, boxShadow:'inset 0 0 0 3px #fff' },

  requiredStar: { color:'#E24B4A', fontSize:12, textTransform:'none', letterSpacing:0 },
  textarea: { width:'100%', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:13, resize:'none', height:78, fontFamily:'inherit', background:'#fff', color:'#111', outline:'none', boxSizing:'border-box' },
  textareaError: { border:'1px solid #E24B4A', background:'#fff9f9' },
  charCountRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 },
  charCount: { fontSize:11, color:'#d1d5db' },
  errorMsg:  { fontSize:11, color:'#E24B4A' },

  tzBar:  { display:'flex', alignItems:'center', gap:8, background:tealLight, borderRadius:8, padding:'9px 13px', marginBottom:'1rem' },
  tzText: { fontSize:12, color:tealDark, fontWeight:500 },
  tzSub:  { fontSize:11, color:teal, marginLeft:'auto' },

  slotsHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.9rem', flexWrap:'wrap', gap:8 },
  slotHeaderRight: { display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  nextTag: { fontSize:11, background:'#FAEEDA', color:'#633806', padding:'3px 9px', borderRadius:999, fontWeight:500 },
  legend:  { display:'flex', gap:12 },
  emptyMsg: { fontSize:13, color:'#9ca3af' },
  slotGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 },
  slotBtn: { padding:'12px 4px', border:'0.5px solid #e5e7eb', borderRadius:999, background:'#fff', color:'#111', fontSize:13, textAlign:'center', cursor:'pointer', position:'relative', fontFamily:'inherit' },
  slotSel:  { background:teal, color:'#fff', borderColor:tealDark, fontWeight:500 },
  slotNext: { border:`1.5px solid ${teal}` },
  nextDot:  { position:'absolute', top:-3, right:8, width:7, height:7, borderRadius:'50%', background:teal },

  summaryRow:   { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'0.5px solid #f3f4f6' },
  summaryLabel: { fontSize:12, color:'#9ca3af' },
  summaryValue: { fontSize:13, fontWeight:500, color:'#111' },
  summaryFee:   { fontSize:16, color:tealDark },
  tzPill:       { fontSize:11, color:teal },

  confirmBtn: { width:'100%', background:teal, color:'#fff', border:'none', borderRadius:999, padding:15, fontSize:15, fontWeight:500, cursor:'pointer', marginBottom:'1.5rem' },
  confirmBtnDisabled: { opacity:0.45, cursor:'not-allowed' },

  divider: { display:'flex', alignItems:'center', gap:10, marginBottom:'1rem' },
  divLine: { flex:1, height:0.5, background:'#e5e7eb' },
  divText: { fontSize:11, color:'#d1d5db', whiteSpace:'nowrap' },

  reschedule: { display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#185FA5', cursor:'pointer', padding:'11px 1.2rem', background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, marginBottom:'1rem' },
  listItem:   { fontSize:12, color:'#6b7280', padding:'5px 0', borderBottom:'0.5px solid #f3f4f6', lineHeight:1.5 },
};