import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, LogOut, Video, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`);
      setAppointments(response.data);
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

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await axios.put(`${API}/appointments/${appointmentId}/status`, { status });
      toast.success('Status updated successfully');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const todayAppointments = appointments.filter(
    apt => apt.date === new Date().toISOString().split('T')[0]
  );
  
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');

  return (
    <div className="min-h-screen bg-accent/30" data-testid="doctor-dashboard">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-serif font-bold text-primary" data-testid="dashboard-logo">HealthLine</h1>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground" data-testid="doctor-name">Welcome, {user?.full_name}</p>
              <Button onClick={handleLogout} variant="outline" className="rounded-full" data-testid="logout-button">
                <LogOut size={16} className="mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2" data-testid="dashboard-title">Doctor Dashboard</h2>
          <p className="text-muted-foreground" data-testid="dashboard-subtitle">Manage your appointments and consultations</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="rounded-2xl border-none bg-white shadow-lg" data-testid="stat-today">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Today's Appointments</p>
                  <p className="text-3xl font-bold text-primary">{todayAppointments.length}</p>
                </div>
                <Calendar className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none bg-white shadow-lg" data-testid="stat-pending">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending</p>
                  <p className="text-3xl font-bold text-primary">{pendingAppointments.length}</p>
                </div>
                <Clock className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none bg-white shadow-lg" data-testid="stat-completed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Completed</p>
                  <p className="text-3xl font-bold text-primary">{completedAppointments.length}</p>
                </div>
                <Users className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none bg-white shadow-lg" data-testid="stat-total">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Appointments</p>
                  <p className="text-3xl font-bold text-primary">{appointments.length}</p>
                </div>
                <Calendar className="text-primary" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card className="rounded-3xl border-none shadow-lg" data-testid="appointments-card">
          <CardHeader>
            <CardTitle className="text-2xl font-serif" data-testid="appointments-title">All Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground" data-testid="loading-text">Loading...</p>
            ) : appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8" data-testid="no-appointments">No appointments yet</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100"
                    data-testid={`appointment-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {appointment.consultation_type === 'video' ? (
                          <Video className="text-primary" size={20} />
                        ) : (
                          <MessageCircle className="text-primary" size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`appointment-reason-${index}`}>{appointment.reason}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`appointment-datetime-${index}`}>
                          {appointment.date} at {appointment.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`} data-testid={`appointment-status-${index}`}>
                        {appointment.status}
                      </span>
                      {appointment.status === 'pending' && (
                        <Button
                          onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                          size="sm"
                          className="rounded-full"
                          data-testid={`confirm-button-${index}`}
                        >
                          Confirm
                        </Button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <>
                          <Button
                            onClick={() => navigate(`/consultation/${appointment.id}`)}
                            size="sm"
                            className="rounded-full"
                            data-testid={`join-button-${index}`}
                          >
                            Join
                          </Button>
                          <Button
                            onClick={() => navigate(`/doctor/prescription/${appointment.id}`)}
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            data-testid={`prescription-button-${index}`}
                          >
                            Prescription
                          </Button>
                        </>
                      )}
                    </div>
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