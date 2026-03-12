import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Video, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import ReviewList from '@/components/ReviewList'; // ✅ ADD HUA

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

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  useEffect(() => {
    if (selectedDate) fetchAvailability();
  }, [selectedDate]);

  const fetchDoctorProfile = async () => {
    try {
      const response = await axios.get(`${API}/doctor/profile`);
      setDoctorProfile(response.data);
    } catch (error) {
      toast.error('Failed to fetch doctor profile');
    }
  };

  const fetchAvailability = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`${API}/doctor/availability?date=${dateStr}`);
      setAvailableSlots(response.data.filter((slot) => slot.available));
    } catch (error) {
      toast.error('Failed to fetch availability');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    if (!selectedTime) {
      toast.error('Please select a time slot');
      return;
    }
    if (!doctorProfile) {
      toast.error('Doctor profile not loaded yet');
      return;
    }
    if (!user?.id) {
      toast.error('Please login again');
      return;
    }

    setLoading(true);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

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
      if (!ok) {
        toast.error('Razorpay failed to load. Check internet and try again.');
        return;
      }

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
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.full_name,
          email: user.email,
        },
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

  return (
    <div className="min-h-screen bg-accent/30">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button onClick={() => navigate('/patient/dashboard')} variant="ghost" size="sm">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Book Appointment</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* ✅ Doctor Info Card — Reviews ke upar */}
        {doctorProfile && (
          <Card className="mb-8 rounded-2xl border-none shadow-md">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-2xl font-bold text-teal-700">
                {doctorProfile.full_name?.charAt(0) || 'D'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Dr. {doctorProfile.full_name}
                </h2>
                {doctorProfile.specialization && (
                  <p className="text-gray-500 text-sm">{doctorProfile.specialization}</p>
                )}
                {doctorProfile.consultation_fee && (
                  <p className="text-teal-600 font-medium text-sm mt-1">
                    Consultation Fee: ₹{doctorProfile.consultation_fee}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleBookAppointment}>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consultation Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={consultationType} onValueChange={setConsultationType}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="video" id="video" />
                    <label htmlFor="video" className="flex items-center cursor-pointer">
                      <Video className="mr-2" size={18} />
                      Video
                    </label>
                  </div>
                  <div className="flex items-center space-x-3 mt-3">
                    <RadioGroupItem value="chat" id="chat" />
                    <label htmlFor="chat" className="flex items-center cursor-pointer">
                      <MessageCircle className="mr-2" size={18} />
                      Chat
                    </label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your health concern..."
                required
              />
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Available Time Slots</CardTitle>
            </CardHeader>
            <CardContent>
              {availableSlots.length === 0 ? (
                <p className="text-gray-500 text-sm">No available slots for this date</p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={selectedTime === slot.time ? 'default' : 'outline'}
                      onClick={() => setSelectedTime(slot.time)}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8">
            <Button type="submit" disabled={loading || !selectedTime}>
              {loading ? 'Processing...' : 'Confirm Appointment'}
            </Button>
          </div>
        </form>

        {/* ✅ REVIEWS SECTION — Form ke bilkul neeche */}
        {doctorProfile && (
          <div className="mt-10 border-t border-gray-200 pt-8">
            <ReviewList doctorId={doctorProfile.id} />
          </div>
        )}

      </div>
    </div>
  );
}
