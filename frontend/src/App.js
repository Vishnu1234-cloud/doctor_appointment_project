import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PatientDashboard from "@/pages/PatientDashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";
import BookAppointment from "@/pages/BookAppointment";
import ConsultationRoom from "@/pages/ConsultationRoom";
import PrescriptionsPage from "@/pages/PrescriptionsPage";
import MedicalHistory from "@/pages/MedicalHistory";
import CreatePrescription from "@/pages/CreatePrescription";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";
import TermsConditions from "@/pages/TermsConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />

        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/book-appointment"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/prescriptions"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PrescriptionsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/medical-history"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <MedicalHistory />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/prescription/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <CreatePrescription />
            </ProtectedRoute>
          }
        />

        {/* Consultation */}
        <Route
          path="/consultation/:appointmentId"
          element={
            <ProtectedRoute>
              <ConsultationRoom />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Toaster richColors position="top-right" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;