import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CreatePrescription() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '', instructions: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await axios.get(`${API}/appointments/${appointmentId}`);
      setAppointment(response.data);
    } catch (error) {
      toast.error('Failed to fetch appointment');
    }
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!diagnosis || medicines.some(m => !m.name)) {
      toast.error('Please fill in diagnosis and all medicine names');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/prescriptions`, {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        medicines: medicines.filter(m => m.name),
        diagnosis,
        notes
      });
      
      toast.success('Prescription created successfully!');
      navigate('/doctor/dashboard');
    } catch (error) {
      toast.error('Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-accent/30" data-testid="create-prescription-page">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/doctor/dashboard')} variant="ghost" size="sm" data-testid="back-button">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-primary" data-testid="page-title">Create Prescription</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="rounded-3xl border-none shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground">Appointment Reason</p>
              <p className="font-medium">{appointment.reason}</p>
              <p className="text-sm text-muted-foreground mt-2">{appointment.date} at {appointment.time}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="rounded-3xl border-none shadow-lg mb-6" data-testid="diagnosis-card">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis..."
                className="rounded-xl min-h-[100px]"
                required
                data-testid="diagnosis-input"
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg mb-6" data-testid="medicines-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-serif">Medicines</CardTitle>
                <Button type="button" onClick={addMedicine} size="sm" className="rounded-full" data-testid="add-medicine-button">
                  <Plus size={18} className="mr-2" /> Add Medicine
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicines.map((medicine, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl space-y-3" data-testid={`medicine-${index}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Medicine {index + 1}</h4>
                    {medicines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedicine(index)}
                        data-testid={`remove-medicine-${index}`}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label>Medicine Name *</Label>
                      <Input
                        value={medicine.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        placeholder="e.g., Paracetamol"
                        className="rounded-xl"
                        required
                        data-testid={`medicine-name-${index}`}
                      />
                    </div>
                    <div>
                      <Label>Dosage</Label>
                      <Input
                        value={medicine.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        className="rounded-xl"
                        data-testid={`medicine-dosage-${index}`}
                      />
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input
                        value={medicine.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        placeholder="e.g., 5 days"
                        className="rounded-xl"
                        data-testid={`medicine-duration-${index}`}
                      />
                    </div>
                    <div>
                      <Label>Instructions</Label>
                      <Input
                        value={medicine.instructions}
                        onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                        placeholder="e.g., After meals"
                        className="rounded-xl"
                        data-testid={`medicine-instructions-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg mb-6" data-testid="notes-card">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional instructions or notes..."
                className="rounded-xl min-h-[100px]"
                data-testid="notes-input"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/doctor/dashboard')}
              className="rounded-full"
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-full"
              disabled={loading}
              data-testid="create-prescription-button"
            >
              {loading ? 'Creating...' : 'Create Prescription'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}