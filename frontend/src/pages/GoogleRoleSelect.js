import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export default function GoogleRoleSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // URL se token lo
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (!t) {
      navigate('/login');
      return;
    }
    setToken(t);
  }, []);

  const handleRoleSelect = async (role) => {
    setLoading(true);
    try {
      // Token save karo
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Backend ko role update karo
      await axios.patch(
        `${API}/auth/update-role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${role === 'doctor' ? 'Doctor' : 'Patient'} ke roop mein registered!`);

      // Dashboard pe redirect karo
      if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }

      window.location.reload();
    } catch (error) {
      toast.error('Role select nahi ho saka, dobara try karo');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 px-4">
      <Card className="w-full max-w-md rounded-3xl border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-serif text-center">
            Aap Kaun Hain? 👋
          </CardTitle>
          <p className="text-center text-muted-foreground mt-2">
            Google se successfully connect ho gaye!
            <br />
            Ab batayein aap kis role mein join karna chahte hain?
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* Patient */}
            <button
              onClick={() => handleRoleSelect('patient')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all group"
            >
              <span className="text-5xl mb-3">👤</span>
              <span className="font-semibold text-gray-800 group-hover:text-teal-700">
                Patient
              </span>
              <span className="text-xs text-gray-400 mt-1 text-center">
                Doctor se appointment lena hai
              </span>
            </button>

            {/* Doctor */}
            <button
              onClick={() => handleRoleSelect('doctor')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all group"
            >
              <span className="text-5xl mb-3">🩺</span>
              <span className="font-semibold text-gray-800 group-hover:text-teal-700">
                Doctor
              </span>
              <span className="text-xs text-gray-400 mt-1 text-center">
                Patients ko consult karna hai
              </span>
            </button>
          </div>

          {loading && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Setting up your account...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}