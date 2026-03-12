import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState('password');

  // Password login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP login
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpChannel, setOtpChannel] = useState('email');
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState('');
  const [otpId, setOtpId] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Login successful!');
      if (user?.role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail) return toast.error('Email daalo pehle');
    if (otpChannel === 'sms' && !otpPhone) return toast.error('Phone number daalo');
    if (otpChannel === 'sms' && !/^[6-9]\d{9}$/.test(otpPhone)) {
      return toast.error('Valid 10 digit Indian phone number daalo');
    }
    setLoading(true);
    try {
      const payload = {
        email: otpEmail,
        delivery_channel: otpChannel,
      };
      if (otpChannel === 'sms') {
        payload.phone = `+91${otpPhone}`;
      }
      const res = await axios.post(`${API}/auth/request-otp`, payload);
      setUserId(res.data.user_id);
      setOtpId(res.data.otp_id);
      setOtpSent(true);
      toast.success(`OTP aapke ${otpChannel === 'sms' ? 'mobile' : 'email'} pe bhej diya gaya!`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'OTP send nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('6 digit OTP daalo');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, {
        user_id: userId,
        otp_id: otpId,
        otp,
      });

      const token = res.data.token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast.success('Login successful!');
      window.location.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'OTP galat hai ya expire ho gaya');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/resend-otp`, {
        user_id: userId,
        delivery_channel: otpChannel,
      });
      setOtpId(res.data.otp_id);
      toast.success('Naya OTP bhej diya!');
    } catch (err) {
      toast.error('OTP resend nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 px-4" data-testid="login-page">
      <Card className="w-full max-w-md rounded-3xl border-none shadow-lg" data-testid="login-card">
        <CardHeader>
          <CardTitle className="text-3xl font-serif text-center" data-testid="login-title">
            Welcome Back
          </CardTitle>
          <p className="text-center text-muted-foreground" data-testid="login-subtitle">
            Sign in to your account
          </p>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-full p-1 mt-3">
            <button
              type="button"
              onClick={() => { setMode('password'); setOtpSent(false); }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                mode === 'password' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              🔒 Password
            </button>
            <button
              type="button"
              onClick={() => { setMode('otp'); setOtpSent(false); }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                mode === 'otp' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              📱 OTP
            </button>
          </div>
        </CardHeader>

        <CardContent>

          {/* PASSWORD MODE */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="rounded-xl h-12"
                  required
                  data-testid="login-email-input"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-12"
                  required
                  data-testid="login-password-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-full h-12"
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-teal-600 hover:underline">
                  Password bhool gaye? 🔑
                </Link>
              </div>
            </form>
          )}

          {/* OTP MODE — Step 1 */}
          {mode === 'otp' && !otpSent && (
            <form onSubmit={handleSendOtp} className="space-y-4">

              {/* Channel Select */}
              <div>
                <Label>OTP Kahan Bhejein?</Label>
                <div className="flex bg-gray-100 rounded-xl p-1 mt-1">
                  <button
                    type="button"
                    onClick={() => setOtpChannel('email')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      otpChannel === 'email' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                    }`}
                  >
                    📧 Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpChannel('sms')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      otpChannel === 'sms' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                    }`}
                  >
                    📱 SMS
                  </button>
                </div>
              </div>

              {/* Email Field — hamesha dikhega */}
              <div>
                <Label htmlFor="otp-email">Email</Label>
                <Input
                  id="otp-email"
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="rounded-xl h-12"
                  required
                />
              </div>

              {/* Phone Field — sirf SMS select karne pe dikhega */}
              {otpChannel === 'sms' && (
                <div>
                  <Label htmlFor="otp-phone">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center bg-gray-100 rounded-xl px-3 h-12 text-sm font-medium text-gray-600 border border-gray-200">
                      +91
                    </div>
                    <Input
                      id="otp-phone"
                      type="tel"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="rounded-xl h-12 flex-1"
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    📱 Registered mobile number pe OTP aayega
                  </p>
                </div>
              )}

              {otpChannel === 'email' && (
                <p className="text-xs text-gray-400 text-center">
                  📧 Email pe OTP aayega (Spam folder bhi check karein)
                </p>
              )}

              <Button
                type="submit"
                className="w-full rounded-full h-12"
                disabled={loading}
              >
                {loading ? 'Bhej raha hai...' : '📨 OTP Bhejo'}
              </Button>
            </form>
          )}

          {/* OTP MODE — Step 2 */}
          {mode === 'otp' && otpSent && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-sm text-green-700 font-medium">
                  ✅ OTP bheja gaya!
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {otpChannel === 'sms'
                    ? `📱 +91${otpPhone} pe SMS check karein`
                    : `📧 ${otpEmail} ka inbox check karein`}
                </p>
              </div>

              <div>
                <Label htmlFor="otp-code">6-Digit OTP</Label>
                <Input
                  id="otp-code"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="rounded-xl h-12 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-full h-12"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verify ho raha hai...' : '✅ OTP Verify Karo'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ← Wapas jao
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-teal-600 hover:underline"
                >
                  OTP dobara bhejo
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-400">Ya phir</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-full h-12 hover:bg-gray-50 transition-colors"
            data-testid="google-login-button"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span className="text-gray-700 font-medium">Google se Login Karo</span>
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium" data-testid="register-link">
              Register here
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            <Link to="/" className="text-primary" data-testid="home-link">
              ← Back to Home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}