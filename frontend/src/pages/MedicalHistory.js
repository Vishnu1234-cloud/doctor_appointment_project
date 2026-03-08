import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, FileText, Calendar } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MedicalHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [recordType, setRecordType] = useState('report');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`${API}/medical-records`);
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !description) {
      toast.error('Please select a file and add description');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('description', description);
      formData.append('record_type', recordType);

      await axios.post(`${API}/medical-records/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Medical record uploaded successfully');
      setSelectedFile(null);
      setDescription('');
      fetchRecords();
    } catch (error) {
      toast.error('Failed to upload record');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent/30" data-testid="medical-history-page">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/patient/dashboard')} variant="ghost" size="sm" data-testid="back-button">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-primary" data-testid="page-title">Medical History</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upload Section */}
        <Card className="rounded-3xl border-none shadow-lg mb-8" data-testid="upload-card">
          <CardHeader>
            <CardTitle className="text-xl font-serif" data-testid="upload-title">Upload Medical Records</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <Label htmlFor="recordType">Record Type</Label>
                <select
                  id="recordType"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-200 px-4"
                  data-testid="record-type-select"
                >
                  <option value="report">Lab Report</option>
                  <option value="scan">Scan/X-Ray</option>
                  <option value="prescription">Previous Prescription</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="rounded-xl h-12"
                  accept=".pdf,.jpg,.jpeg,.png"
                  data-testid="file-input"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the document"
                  className="rounded-xl h-12"
                  data-testid="description-input"
                />
              </div>

              <Button
                type="submit"
                className="rounded-full w-full"
                disabled={uploading}
                data-testid="upload-button"
              >
                <Upload size={18} className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload Record'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card className="rounded-3xl border-none shadow-lg" data-testid="records-card">
          <CardHeader>
            <CardTitle className="text-xl font-serif" data-testid="records-title">Your Medical Records</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12" data-testid="no-records">
                <FileText className="text-muted-foreground mx-auto mb-4" size={48} />
                <p className="text-muted-foreground">No medical records uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100"
                    data-testid={`record-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`record-desc-${index}`}>{record.description}</p>
                        <p className="text-sm text-muted-foreground">
                          <Calendar size={14} className="inline mr-1" />
                          {new Date(record.uploaded_at).toLocaleDateString()} • {record.record_type}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-full" size="sm" data-testid={`view-button-${index}`}>
                      View
                    </Button>
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