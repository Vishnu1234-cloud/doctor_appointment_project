import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

function useWindowWidth() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:20,height:20}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:20,height:20}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const Spinner = () => (
  <svg style={{animation:'spin 1s linear infinite',width:16,height:16}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12 0 12h0a8 8 0 018 8z"/>
  </svg>
);

const medicalImages = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80',
  'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&q=80',
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&q=80',
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80',
];

function ForgotPasswordModal({ onClose }) {
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!forgotEmail && !forgotPhone) { setError('Please enter your email or mobile number.'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, {
        email: forgotEmail || undefined,
        phone: forgotPhone ? `+91${forgotPhone}` : undefined,
        delivery_channel: forgotEmail ? 'email' : 'sms',
      });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', padding:'0 16px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:8, width:'100%', maxWidth:420, position:'relative' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'28px 28px 16px' }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#1f2937', margin:0 }}>Forgot your Password?</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:24, color:'#9ca3af', lineHeight:1, padding:'0 0 0 12px', marginTop:-2 }}>×</button>
        </div>
        <div style={{ padding:'0 28px 28px' }}>
          {!sent ? (
            <>
              <p style={{ fontSize:14, color:'#6b7280', marginBottom:20, lineHeight:1.6 }}>
                Enter your email address or mobile number and we'll send you a link or OTP to reset your password.
              </p>
              <form onSubmit={handleSubmit}>
                <input type="email" value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); setForgotPhone(''); setError(''); }}
                  placeholder="Enter Your Email"
                  style={{ width:'100%', padding:'12px 14px', border:'1px solid #d1d5db', borderRadius:4, fontSize:14, outline:'none', marginBottom:4, boxSizing:'border-box' }} />
                <div style={{ textAlign:'center', color:'#6b7280', fontSize:14, fontWeight:500, margin:'12px 0' }}>(OR)</div>
                <input type="tel" value={forgotPhone}
                  onChange={(e) => { setForgotPhone(e.target.value.replace(/\D/g,'').slice(0,10)); setForgotEmail(''); setError(''); }}
                  placeholder="Enter Your Mobile No."
                  style={{ width:'100%', padding:'12px 14px', border:'1px solid #d1d5db', borderRadius:4, fontSize:14, outline:'none', marginBottom:4, boxSizing:'border-box' }}
                  maxLength={10} />
                {error && <p style={{ color:'#dc2626', fontSize:13, marginTop:8, marginBottom:0 }}>{error}</p>}
                <button type="submit" disabled={loading || (!forgotEmail && !forgotPhone)}
                  style={{ marginTop:20, width:'100%', padding:'12px', background:'#3b6fd4', color:'#fff', border:'none', borderRadius:4, fontSize:14, fontWeight:700, letterSpacing:'0.08em', cursor:loading?'not-allowed':'pointer', opacity:(loading||(!forgotEmail&&!forgotPhone))?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {loading ? <><Spinner /> SENDING...</> : 'SUBMIT'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <svg style={{ width:28, height:28, color:'#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontWeight:700, fontSize:18, color:'#15803d', marginBottom:8 }}>OTP Sent!</p>
              <p style={{ color:'#6b7280', fontSize:14, marginBottom:24 }}>Check your {forgotEmail ? 'email inbox' : 'SMS messages'} for the reset OTP.</p>
              <button onClick={onClose} style={{ padding:'10px 32px', background:'#3b6fd4', color:'#fff', border:'none', borderRadius:4, fontSize:14, fontWeight:600, cursor:'pointer' }}>Back to Login</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const w = useWindowWidth();
  const isMobile = w < 1024;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [otpChannel, setOtpChannel] = useState('email');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState('');
  const [otpId, setOtpId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setPwError('');
    if (!identifier.trim()) { setPwError('Email or mobile number is required.'); return; }
    if (!password) { setPwError('Password is required.'); return; }
    setPwLoading(true);
    try {
      const user = await login(identifier, password);
      toast.success('Welcome back!');
      if (user?.role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } catch (error) {
      const msg = error?.response?.data?.detail || '';
      if (msg.toLowerCase().includes('oauth') || msg.toLowerCase().includes('google')) {
        setPwError('This account uses Google Sign-In. Please use "Continue with Google".');
      } else {
        setPwError('Invalid credentials. Please check and try again.');
      }
    } finally { setPwLoading(false); }
  };

  // ✅ FIX 1 — otpId camelCase + snake_case dono handle karo
  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter your email or mobile number first.');
      return;
    }
    setOtpLoading(true);
    try {
      const payload = { email: identifier, delivery_channel: otpChannel };
      if (otpChannel === 'sms') payload.phone = `+91${otpPhone || identifier}`;

      const res = await axios.post(`${API}/auth/request-otp`, payload);

      setUserId(res.data.user_id);
      setOtpId(res.data.otpId || res.data.otp_id); // ✅ camelCase + snake_case fix
      setOtpSent(true);
      toast.success(`OTP sent to your ${otpChannel === 'sms' ? 'mobile' : 'email'}!`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP.'); return; }
    setOtpLoading(true);
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, { user_id: userId, otp_id: otpId, otp });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      toast.success('Login successful!');
      window.location.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Invalid or expired OTP.');
    } finally { setOtpLoading(false); }
  };

  // ✅ FIX 2 — Resend mein bhi otpId camelCase + snake_case fix
  const handleResendOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await axios.post(`${API}/auth/resend-otp`, {
        user_id: userId,
        delivery_channel: otpChannel,
      });
      setOtpId(res.data.otpId || res.data.otp_id); // ✅ camelCase + snake_case fix
      toast.success('New OTP sent!');
    } catch {
      toast.error('Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const s = {
    input: { width:'100%', padding:'11px 14px', border:'1px solid #d1d5db', borderRadius:4, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1f2937', background:'#fff' },
    btn: { width:'100%', padding:'12px', background:'#3b6fd4', color:'#fff', border:'none', borderRadius:4, fontSize:15, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
    label: { display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity:0; transform:translateY(-12px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        input:focus { border-color: #3b6fd4 !important; box-shadow: 0 0 0 3px rgba(59,111,212,.1); }
        .hl-btn-hover:hover:not(:disabled) { background:#2d5bb8 !important; }
        .hl-btn-hover:disabled { opacity:.6; cursor:not-allowed; }
        .hl-google:hover { background:#f9fafb !important; }
        .hl-otp-ch:hover { border-color:#3b6fd4; }
      `}</style>

      <div style={{ minHeight:'100vh', display:'flex', background:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* LEFT — Image collage — hidden on mobile */}
        {!isMobile && (
          <div style={{ width:'55%', padding:'32px 40px', background:'#f0f6ff', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', marginBottom:32 }}>
              <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#0d9488,#3b6fd4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span style={{ fontSize:20, fontWeight:700, color:'#1e3a5f' }}>HealthLine</span>
            </Link>
            <div style={{ display:'grid', gridTemplateColumns:'90px 1fr 110px', gap:10, marginBottom:10 }}>
              <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                <div style={{ overflow:'hidden', borderRadius:8, height:90, marginLeft:10 }}>
                  <img src={medicalImages[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                </div>
              </div>
              <div style={{ overflow:'hidden', borderRadius:8, height:200 }}>
                <img src={medicalImages[1]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ overflow:'hidden', borderRadius:8, flex:1 }}>
                  <img src={medicalImages[2]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                </div>
                <div style={{ borderRadius:8, background:'linear-gradient(135deg,#3b6fd4,#1e3a5f)', flex:1 }} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'70px 130px 1fr 110px', gap:10, height:150 }}>
              <div style={{ borderRadius:8, background:'linear-gradient(135deg,#1e3a5f,#2d4a7a)', alignSelf:'flex-start', height:90, marginTop:30 }} />
              <div style={{ overflow:'hidden', borderRadius:8 }}>
                <img src={medicalImages[3]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
              <div style={{ overflow:'hidden', borderRadius:8 }}>
                <img src={medicalImages[4]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
              <div style={{ overflow:'hidden', borderRadius:8, alignSelf:'flex-end', height:90 }}>
                <img src={medicalImages[5]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(24,1fr)', gap:5, opacity:0.25, marginTop:16 }}>
              {Array.from({ length:96 }).map((_, i) => <div key={i} style={{ width:4, height:4, borderRadius:'50%', background:'#3b6fd4' }} />)}
            </div>
          </div>
        )}

        {/* RIGHT — Form */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:isMobile?'32px 20px':'40px 48px', overflowY:'auto' }}>
          <div style={{ width:'100%', maxWidth:360 }}>

            {isMobile && (
              <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#0d9488,#3b6fd4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <Link to="/" style={{ textDecoration:'none', fontSize:20, fontWeight:700, color:'#1e3a5f' }}>HealthLine</Link>
              </div>
            )}

            <h2 style={{ fontSize:isMobile?22:26, fontWeight:700, color:'#1e3a5f', marginBottom:28 }}>Login to HealthLine</h2>

            <form onSubmit={handlePasswordLogin}>
              <div style={{ marginBottom:16 }}>
                <label style={s.label}>Email ID or Mobile Number</label>
                <input type="text" value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setPwError(''); }}
                  placeholder="Enter your Email ID or Mobile Number"
                  style={s.input} autoFocus autoComplete="username" />
              </div>

              <div style={{ marginBottom:4 }}>
                <label style={s.label}>Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPassword?'text':'password'} value={password}
                    onChange={(e) => { setPassword(e.target.value); setPwError(''); }}
                    placeholder="Enter your Password"
                    style={{ ...s.input, paddingRight:44 }} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:0, display:'flex' }} tabIndex={-1}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {pwError && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:4, padding:'9px 13px', fontSize:13, color:'#dc2626', marginTop:8 }}>{pwError}</div>
              )}

              <div style={{ textAlign:'right', marginTop:10, marginBottom:4 }}>
                <button type="button" onClick={() => setShowForgot(true)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#3b6fd4', fontWeight:500, fontSize:14 }}>
                  Forgot password?
                </button>
              </div>

              <div style={{ textAlign:'center', color:'#6b7280', fontSize:14, fontWeight:500, margin:'18px 0' }}>(OR)</div>

              <div style={{ marginBottom:20 }}>
                <label style={{ ...s.label, marginBottom:10 }}>Login with OTP</label>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  {[{id:'email',label:'📧 Email OTP'},{id:'sms',label:'📱 SMS OTP'}].map(ch => (
                    <button key={ch.id} type="button" onClick={() => setOtpChannel(ch.id)}
                      style={{ flex:1, padding:'9px 8px', border:`1.5px solid ${otpChannel===ch.id?'#3b6fd4':'#d1d5db'}`, borderRadius:4, fontSize:13, fontWeight:otpChannel===ch.id?600:500, cursor:'pointer', background:otpChannel===ch.id?'#eff4ff':'#fff', color:otpChannel===ch.id?'#3b6fd4':'#6b7280' }}>
                      {ch.label}
                    </button>
                  ))}
                </div>

                {otpChannel === 'sms' && !otpSent && (
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    <span style={{ display:'flex', alignItems:'center', padding:'0 12px', border:'1px solid #d1d5db', borderRadius:4, background:'#f9fafb', fontSize:14, fontWeight:600, color:'#374151', whiteSpace:'nowrap' }}>+91</span>
                    <input type="tel" value={otpPhone} onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Mobile number" style={s.input} maxLength={10} />
                  </div>
                )}

                {otpSent && (
                  <div style={{ marginBottom:10 }}>
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:4, padding:'8px 12px', fontSize:13, color:'#15803d', marginBottom:10 }}>
                      ✅ OTP sent to your {otpChannel === 'sms' ? `mobile +91${otpPhone}` : identifier}
                    </div>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                      placeholder="Enter OTP"
                      style={{ ...s.input, letterSpacing:'0.25em', fontSize:20, fontWeight:700, textAlign:'center', marginBottom:8 }}
                      maxLength={6} autoComplete="one-time-code" autoFocus />
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#6b7280' }}>← Change</button>
                      <button type="button" onClick={handleResendOtp} disabled={otpLoading}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#3b6fd4', fontWeight:500, fontSize:13 }}>Resend OTP</button>
                    </div>
                  </div>
                )}

                {!otpSent && (
                  <button type="button" onClick={handleSendOtp} disabled={otpLoading} className="hl-btn-hover"
                    style={{ padding:'10px 20px', background:'#3b6fd4', color:'#fff', border:'none', borderRadius:4, fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, opacity:otpLoading?0.6:1 }}>
                    {otpLoading ? <><Spinner /> Sending...</> : 'SEND OTP'}
                  </button>
                )}
              </div>

              <button type={otpSent?'button':'submit'} onClick={otpSent?handleOtpLogin:undefined}
                disabled={pwLoading||otpLoading||(otpSent&&otp.length!==6)} className="hl-btn-hover"
                style={{ ...s.btn, opacity:(pwLoading||otpLoading||(otpSent&&otp.length!==6))?0.6:1 }}>
                {(pwLoading||otpLoading) ? <><Spinner /> Please wait...</> : 'Login'}
              </button>
            </form>

            <div style={{ textAlign:'center', color:'#6b7280', fontSize:14, fontWeight:500, margin:'18px 0' }}>(OR)</div>

            <button type="button" onClick={loginWithGoogle} className="hl-google"
              style={{ width:'100%', padding:'11px', border:'1.5px solid #d1d5db', borderRadius:4, background:'#fff', cursor:'pointer', fontSize:14, fontWeight:500, color:'#374151', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <GoogleIcon /> Continue with Google
            </button>

            <p style={{ textAlign:'center', fontSize:14, color:'#6b7280', marginTop:24 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color:'#3b6fd4', fontWeight:600, textDecoration:'none', fontSize:14 }}>Create account</Link>
            </p>
            <p style={{ textAlign:'center', marginTop:8 }}>
              <Link to="/" style={{ fontSize:13, color:'#9ca3af', textDecoration:'none' }}>← Back to Home</Link>
            </p>
          </div>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}