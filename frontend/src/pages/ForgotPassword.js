import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otpId, setOtpId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('email');

  // Step 1 — Email submit
  const handleSendOtp = async () => {
    if (!email) return toast.error('Email daalo!');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, {
        email,
        delivery_channel: channel,
      });
      setUserId(res.data.user_id);
      setOtpId(res.data.otp_id);
      toast.success(`OTP bheja gaya ${channel} pe!`);
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'OTP nahi bheja ja saka');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — OTP verify + new password
  const handleReset = async () => {
    if (!otp) return toast.error('OTP daalo!');
    if (!newPassword) return toast.error('Naya password daalo!');
    if (newPassword !== confirmPassword) return toast.error('Passwords match nahi kar rahe!');
    if (newPassword.length < 8) return toast.error('Password kam se kam 8 characters ka hona chahiye!');

    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/reset-password`, {
        user_id: userId,
        otp_id: otpId,
        otp,
        new_password: newPassword,
      });
      localStorage.setItem('token', res.data.token);
      toast.success('Password reset ho gaya! ✅');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Reset nahi ho saka');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-700">🔐 HealthLine</h1>
          <p className="text-gray-500 mt-2">
            {step === 1 ? 'Password bhool gaye? OTP se reset karein' : 'OTP aur naya password daalo'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`h-1 w-12 ${step >= 2 ? 'bg-teal-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aapka@email.com"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">OTP Kahan Bhejein?</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChannel('email')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${channel === 'email' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  📧 Email
                </button>
                <button
                  onClick={() => setChannel('sms')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${channel === 'sms' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  📱 SMS
                </button>
              </div>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              {loading ? 'Bhej rahe hain...' : 'OTP Bhejo →'}
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                maxLength={6}
                className="w-full border rounded-xl px-4 py-3 text-sm text-center tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Naya Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kam se kam 8 characters"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Password Confirm Karein</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Wahi password dobara daalo"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              {loading ? 'Reset ho raha hai...' : '✅ Password Reset Karein'}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-gray-500 text-sm hover:text-teal-600"
            >
              ← Wapas Jaao
            </button>
          </div>
        )}

        {/* Login Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Password yaad aa gaya?{' '}
          <Link to="/login" className="text-teal-600 font-semibold hover:underline">
            Login Karein
          </Link>
        </p>
      </div>
    </div>
  );
}