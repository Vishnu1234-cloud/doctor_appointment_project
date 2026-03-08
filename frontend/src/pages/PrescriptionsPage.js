import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get(`${API}/prescriptions`);
      console.log('Prescriptions fetched:', response.data);
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Prescription fetch error:', error.response || error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to fetch prescriptions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (prescriptionId) => {
    setDownloadingId(prescriptionId);
    try {
      const response = await axios.get(`${API}/prescriptions/${prescriptionId}/pdf`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription_${prescriptionId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Prescription downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download prescription');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-accent/30" data-testid="prescriptions-page">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/patient/dashboard')} variant="ghost" size="sm" data-testid="back-button">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-primary" data-testid="page-title">My Prescriptions</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-2 text-muted-foreground" data-testid="loading-text">Loading prescriptions...</span>
          </div>
        ) : prescriptions.length === 0 ? (
          <Card className="rounded-3xl border-none shadow-lg" data-testid="no-prescriptions">
            <CardContent className="py-12 text-center">
              <FileText className="text-muted-foreground mx-auto mb-4" size={48} />
              <p className="text-muted-foreground text-lg mb-2">No prescriptions yet</p>
              <p className="text-muted-foreground text-sm">Your prescriptions will appear here after consultations</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {prescriptions.map((prescription, index) => (
              <Card key={prescription.id} className="rounded-3xl border-none shadow-lg" data-testid={`prescription-${index}`}>
                <CardHeader>
                  <CardTitle className="text-xl font-serif flex items-center justify-between" data-testid={`prescription-title-${index}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="text-primary" size={20} />
                      </div>
                      <span>Prescription #{prescription.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-normal">
                      {new Date(prescription.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">Diagnosis</h4>
                    <p className="text-foreground text-lg" data-testid={`diagnosis-${index}`}>{prescription.diagnosis}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-3">Prescribed Medicines</h4>
                    <div className="space-y-3">
                      {prescription.medicines.map((medicine, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100" data-testid={`medicine-${index}-${idx}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{medicine.name}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                                {medicine.dosage && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Dosage:</span> {medicine.dosage}
                                  </span>
                                )}
                                {medicine.duration && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Duration:</span> {medicine.duration}
                                  </span>
                                )}
                              </div>
                              {medicine.instructions && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  <span className="font-medium">Instructions:</span> {medicine.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {prescription.notes && (
                    <div className="mb-6">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">Additional Notes</h4>
                      <p className="text-muted-foreground bg-slate-50 p-4 rounded-xl" data-testid={`notes-${index}`}>{prescription.notes}</p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => handleDownloadPDF(prescription.id)}
                    disabled={downloadingId === prescription.id}
                    className="rounded-full" 
                    data-testid={`download-button-${index}`}
                  >
                    {downloadingId === prescription.id ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" /> Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={18} className="mr-2" /> Download PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
