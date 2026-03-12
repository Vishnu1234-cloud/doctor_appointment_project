import React, { useEffect } from "react";
import "@/App.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import axios from "axios";

// Lazy load heavy secure portal routes
const PatientDashboard = React.lazy(() => import("@/pages/PatientDashboard"));
const DoctorDashboard = React.lazy(() => import("@/pages/DoctorDashboard"));
const BookAppointment = React.lazy(() => import("@/pages/BookAppointment"));
const ConsultationRoom = React.lazy(() => import("@/pages/ConsultationRoom"));
const PrescriptionsPage = React.lazy(() => import("@/pages/PrescriptionsPage"));
const MedicalHistory = React.lazy(() => import("@/pages/MedicalHistory"));
const CreatePrescription = React.lazy(() => import("@/pages/CreatePrescription"));
const BlogList = React.lazy(() => import("@/pages/BlogList"));
const BlogPost = React.lazy(() => import("@/pages/BlogPost"));

import TermsConditions from "@/pages/TermsConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import GoogleRoleSelect from "@/pages/GoogleRoleSelect";
import ForgotPassword from "@/pages/ForgotPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import DoctorProfileSetup from "@/pages/DoctorProfileSetup";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Google OAuth token handler
function GoogleAuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      navigate('/login', { replace: true });
      return;
    }

    if (token) {
      if (!location.pathname.includes('/auth/role-select')) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const cleanPath = location.pathname;
        navigate(cleanPath, { replace: true });
        window.location.reload();
      }
    }
  }, []);

  return null;
}

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
      <GoogleAuthHandler />

      <ErrorBoundary>
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif text-lg text-slate-500">Loading modules...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/role-select" element={<GoogleRoleSelect />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund" element={<RefundPolicy />} />

            {/* Admin Route */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

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
            {/* ✅ Doctor Profile Setup */}
            <Route
              path="/doctor/profile-setup"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <DoctorProfileSetup />
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
        </React.Suspense>
      </ErrorBoundary>

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