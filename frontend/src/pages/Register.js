import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// ── Icons ──────────────────────────────────────────────
const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
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
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12 0 12h0a8 8 0 018 8z"/>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#9ca3af" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  // Max date = today (no future DOB)
  const today = new Date().toISOString().split('T')[0];

  // Min date = 100 years ago
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  const minDateStr = minDate.toISOString().split('T')[0];

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'First name is required.';
    if (!formData.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email.';
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) errs.phone = 'Enter a valid 10-digit mobile number.';
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const age = (new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 1) errs.date_of_birth = 'Please enter a valid date of birth.';
    }
    if (!formData.password) errs.password = 'Password is required.';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!agreed) errs.agreed = 'Please accept the Terms of Use and Privacy Policy.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const fullName = formData.last_name
        ? `${formData.full_name.trim()} ${formData.last_name.trim()}`
        : formData.full_name.trim();

      await register({
        full_name: fullName,
        email: formData.email,
        phone: formData.phone ? `+91${formData.phone}` : undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        password: formData.password,
        role: formData.role,
      });
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: { minHeight: '100vh', background: '#fff', fontFamily: "'Inter', -apple-system, sans-serif", padding: '32px 24px' },
    topBar: { maxWidth: 620, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
    wrap: { maxWidth: 620, margin: '0 auto' },
    title: { fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 24, marginTop: 4 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
    req: { color: '#e53e3e', marginLeft: 2 },
    input: { width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1f2937', background: '#fff', transition: 'border-color .2s, box-shadow .2s' },
    inputErr: { borderColor: '#f87171' },
    err: { color: '#dc2626', fontSize: 12, marginTop: 4 },
    btn: { width: '100%', padding: '12px', background: '#3b6fd4', color: '#fff', border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .2s' },
    googleBtn: { width: '100%', padding: '11px', border: '1.5px solid #d1d5db', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background .2s' },
    or: { textAlign: 'center', color: '#6b7280', fontSize: 14, fontWeight: 500, margin: '20px 0' },
    link: { color: '#3b6fd4', fontWeight: 600, textDecoration: 'none' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        input:focus, select:focus { border-color: #3b6fd4 !important; box-shadow: 0 0 0 3px rgba(59,111,212,.1) !important; outline: none !important; }
        .reg-btn:hover:not(:disabled) { background: #2d5bb8 !important; }
        .reg-btn:disabled { opacity: .6; cursor: not-allowed; }
        .reg-google:hover { background: #f9fafb !important; }
        .role-btn { flex:1; padding:11px 8px; border:2px solid #d1d5db; border-radius:4px; font-size:14px; font-weight:500; cursor:pointer; background:#fff; color:#6b7280; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:6px; }
        .role-btn.active { border-color:#3b6fd4; background:#eff4ff; color:#3b6fd4; font-weight:600; }
        .role-btn:hover { border-color:#3b6fd4; }
        .gender-btn { flex:1; padding:10px 8px; border:2px solid #d1d5db; border-radius:4px; font-size:13px; font-weight:500; cursor:pointer; background:#fff; color:#6b7280; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:5px; }
        .gender-btn.active { border-color:#3b6fd4; background:#eff4ff; color:#3b6fd4; font-weight:600; }
        .gender-btn:hover { border-color:#3b6fd4; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
      `}</style>

      <div style={s.page}>

        {/* Top bar */}
        <div style={s.topBar}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg,#0d9488,#3b6fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f' }}>HealthLine</span>
          </Link>
          <span style={{ fontSize: 14, color: '#6b7280' }}>
            Existing user?{' '}
            <Link to="/login" style={s.link}>Log in</Link>
          </span>
        </div>

        <div style={s.wrap}>
          <h2 style={s.title}>Sign up</h2>

          <form onSubmit={handleSubmit}>

            {/* ── Full Name ── */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>
                Full Name<span style={s.req}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="First Name"
                    style={{ ...s.input, ...(errors.full_name ? s.inputErr : {}) }}
                    autoFocus
                  />
                  {errors.full_name && <p style={s.err}>{errors.full_name}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last Name"
                    style={s.input}
                  />
                </div>
              </div>
            </div>

            {/* ── Email ── */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>
                Email Address<span style={s.req}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                style={{ ...s.input, ...(errors.email ? s.inputErr : {}) }}
              />
              {errors.email && <p style={s.err}>{errors.email}</p>}
            </div>

            {/* ── Mobile Number ── */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Mobile Number</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 4, background: '#f9fafb', fontSize: 14, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="Enter Mobile Number"
                  style={{ ...s.input, ...(errors.phone ? s.inputErr : {}) }}
                  maxLength={10}
                />
              </div>
              {errors.phone && <p style={s.err}>{errors.phone}</p>}
            </div>

            {/* ── DOB + Gender (side by side) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>

              {/* Date of Birth */}
              <div>
                <label style={s.label}>
                  Date of Birth<span style={s.req}>*</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  max={today}
                  min={minDateStr}
                  style={{ ...s.input, ...(errors.date_of_birth ? s.inputErr : {}), color: formData.date_of_birth ? '#1f2937' : '#9ca3af' }}
                />
                {errors.date_of_birth && <p style={s.err}>{errors.date_of_birth}</p>}
              </div>

              {/* Gender */}
              <div>
                <label style={s.label}>Gender</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['male', '♂ Male'], ['female', '♀ Female'], ['other', '⚧ Other']].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`gender-btn ${formData.gender === val ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, gender: val })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Register As ── */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Register As<span style={s.req}>*</span></label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className={`role-btn ${formData.role === 'patient' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, role: 'patient' })} data-testid="role-patient">
                  👤 Patient
                </button>
                <button type="button" className={`role-btn ${formData.role === 'doctor' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, role: 'doctor' })} data-testid="role-doctor">
                  🩺 Doctor
                </button>
              </div>
            </div>

            {/* ── Password ── */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Password<span style={s.req}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><LockIcon /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      style={{ ...s.input, paddingLeft: 36, paddingRight: 40, ...(errors.password ? s.inputErr : {}) }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
                      tabIndex={-1}>
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {errors.password && <p style={s.err}>{errors.password}</p>}
                </div>
                <div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><LockIcon /></span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      style={{ ...s.input, paddingLeft: 36, paddingRight: 40, ...(errors.confirmPassword ? s.inputErr : {}) }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
                      tabIndex={-1}>
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {errors.confirmPassword && <p style={s.err}>{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* ── Terms & Privacy ── */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => { setAgreed(e.target.checked); setErrors({ ...errors, agreed: '' }); }}
                  style={{ marginTop: 3, width: 16, height: 16, accentColor: '#3b6fd4', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                  I have read and accept HealthLine's{' '}
                  <Link to="/terms" style={s.link} target="_blank">Terms of Use</Link>
                  {' '}and{' '}
                  <Link to="/privacy" style={s.link} target="_blank">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreed && <p style={s.err}>{errors.agreed}</p>}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading}
              style={{ ...s.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              className="reg-btn"
              data-testid="register-submit-button"
            >
              {loading ? <><Spinner /> Creating Account...</> : 'Next'}
            </button>
          </form>

          {/* OR */}
          <div style={s.or}>(OR)</div>

          {/* Google */}
          <button type="button" onClick={loginWithGoogle} style={s.googleBtn} className="reg-google">
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Login here</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 8 }}>
            <Link to="/" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>← Back to Home</Link>
          </p>
        </div>
      </div>
    </>
  );
}