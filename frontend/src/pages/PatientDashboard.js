import ReviewForm from '@/components/ReviewForm';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Video, MessageCircle, FileText, LogOut } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null); // ✅ ADD HUA

  useEffect(() => {
    fetchAppointments();
  }, []);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':   return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending':     return 'text-yellow-600 bg-yellow-50';
      case 'completed':   return 'text-blue-600 bg-blue-50';
      case 'cancelled':   return 'text-red-600 bg-red-50';
      default:            return 'text-gray-600 bg-gray-50';
    }
  };

  const canJoinConsultation = (status) => {
    return ['confirmed', 'in_progress'].includes(status);
  };

  return (
    <div className="min-h-screen bg-accent/30" data-testid="patient-dashboard">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-serif font-bold text-primary" data-testid="dashboard-logo">
              HealthLine
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground" data-testid="user-name">
                Welcome, {user?.full_name}
              </p>
              <Button onClick={handleLogout} variant="outline" className="rounded-full" data-testid="logout-button">
                <LogOut size={16} className="mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2" data-testid="dashboard-title">
            Patient Dashboard
          </h2>
          <p className="text-muted-foreground" data-testid="dashboard-subtitle">
            Manage your appointments and health records
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="rounded-2xl border-none bg-white hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/patient/book-appointment')} data-testid="quick-action-book">
            <CardContent className="p-6 text-center">
              <Calendar className="text-primary mx-auto mb-3" size={32} />
              <h3 className="font-medium">Book Appointment</h3>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-white hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/patient/prescriptions')} data-testid="quick-action-prescriptions">
            <CardContent className="p-6 text-center">
              <FileText className="text-primary mx-auto mb-3" size={32} />
              <h3 className="font-medium">Prescriptions</h3>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-white hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/patient/medical-history')} data-testid="quick-action-history">
            <CardContent className="p-6 text-center">
              <FileText className="text-primary mx-auto mb-3" size={32} />
              <h3 className="font-medium">Medical History</h3>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-white hover:shadow-lg cursor-pointer"
            onClick={() => navigate('/blog')} data-testid="quick-action-blog">
            <CardContent className="p-6 text-center">
              <FileText className="text-primary mx-auto mb-3" size={32} />
              <h3 className="font-medium">Health Blog</h3>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card className="rounded-3xl border-none shadow-lg" data-testid="appointments-card">
          <CardHeader>
            <CardTitle className="text-2xl font-serif" data-testid="appointments-title">
              My Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground" data-testid="loading-text">Loading...</p>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12" data-testid="no-appointments">
                <Calendar className="text-muted-foreground mx-auto mb-4" size={48} />
                <p className="text-muted-foreground mb-4">No appointments yet</p>
                <Button onClick={() => navigate('/patient/book-appointment')}
                  className="rounded-full" data-testid="book-first-appointment">
                  Book Your First Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col p-4 rounded-xl bg-slate-50 hover:bg-slate-100"
                    data-testid={`appointment-${index}`}
                  >
                    {/* ── Appointment Info Row ── */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {appointment.consultation_type === 'video' ? (
                            <Video className="text-primary" size={20} />
                          ) : (
                            <MessageCircle className="text-primary" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`appointment-reason-${index}`}>
                            {appointment.reason}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`appointment-datetime-${index}`}>
                            <Clock size={14} className="inline mr-1" />
                            {appointment.date} at {appointment.time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}
                          data-testid={`appointment-status-${index}`}
                        >
                          {appointment.status}
                        </span>
                        {canJoinConsultation(appointment.status) && (
                          <Button
                            onClick={() => navigate(`/consultation/${appointment.id}`)}
                            size="sm"
                            className="rounded-full"
                            data-testid={`join-consultation-${index}`}
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* ── ✅ REVIEW SECTION (completed appointments) ── */}
                    {appointment.status === 'completed' && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        {!appointment.hasReviewed ? (
                          <>
                            <button
                              onClick={() =>
                                setReviewingId(
                                  reviewingId === appointment.id ? null : appointment.id
                                )
                              }
                              className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded-full transition-colors"
                              data-testid={`review-button-${index}`}
                            >
                              {reviewingId === appointment.id ? '✕ Band Karein' : '⭐ Review Dein'}
                            </button>
                            {reviewingId === appointment.id && (
                              <ReviewForm
                                doctorId={appointment.doctor_id}
                                appointmentId={appointment.id}
                                onSuccess={() => {
                                  setReviewingId(null);
                                  fetchAppointments();
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">
                            ✓ Review De Diya
                          </span>
                        )}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}