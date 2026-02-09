import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Hospital from './pages/Hospital';
import Shifts from './pages/Shifts';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import DoctorAIChat from './components/DoctorAIChat';
import MyWorkspace from './pages/MyWorkspace';
import Profile from './pages/Profile';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import UserManagement from './pages/UserManagement';
import NurseDashboard from './pages/NurseDashboard';
import DoctorDashboard from './pages/DoctorDashboard';


function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AnimatePresence mode="wait">
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              
              {/* Protected routes with layout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="receptionist-dashboard" element={
                  <ProtectedRoute allowedRoles={['receptionist']}>
                    <ReceptionistDashboard />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={<Profile />} />
                <Route path="my-workspace" element={
                  <ProtectedRoute allowedRoles={['doctor', 'nurse']}>
                    <MyWorkspace />
                  </ProtectedRoute>
                } />
                <Route path="nurse-dashboard" element={
                  <ProtectedRoute allowedRoles={['nurse']}>
                    <NurseDashboard />
                  </ProtectedRoute>
                } />
                <Route path="doctor-dashboard" element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="patients" element={<Patients />} />
                <Route path="staff" element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor']}>
                    <Doctors />
                  </ProtectedRoute>
                } />
                <Route path="user-management" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="hospital-management" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Hospital />
                  </ProtectedRoute>
                } />
                <Route path="shifts" element={<Shifts />} />
                <Route path="analytics" element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor']}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="ai-chat" element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorAIChat />
                  </ProtectedRoute>
                } />
              </Route>

              {/* 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AnimatePresence>
      </Router>
    </AuthProvider>
  );
}

export default App;