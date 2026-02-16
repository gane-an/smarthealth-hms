import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import LiveQueue from './pages/patient/LiveQueue';
import MyAppointments from './pages/patient/MyAppointments';
import Prescriptions from './pages/patient/Prescriptions';
import FeedbackPage from './pages/patient/FeedbackPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AppointmentList from './pages/doctor/AppointmentList';
import UploadPrescription from './pages/doctor/UploadPrescription';
import AdminDashboard from './pages/admin/AdminDashboard';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import DoctorApprovals from './pages/admin/DoctorApprovals';
import UserManagement from './pages/admin/UserManagement';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  // Auth Routes
  {
    name: 'Auth',
    path: '/',
    element: <AuthLayout />,
    children: [
      { name: 'Root', path: '', element: <Navigate to="/login" replace /> },
      { name: 'Login', path: 'login', element: <LoginPage /> },
      { name: 'Register', path: 'register', element: <RegisterPage /> },
    ],
  },
  
  // Patient Routes
  {
    name: 'Patient',
    path: '/patient',
    element: <DashboardLayout />,
    children: [
      { name: 'Patient Dashboard', path: '', element: <PatientDashboard /> },
      { name: 'Book Appointment', path: 'book', element: <BookAppointment /> },
      { name: 'Live Queue', path: 'queue', element: <LiveQueue /> },
      { name: 'My Appointments', path: 'appointments', element: <MyAppointments /> },
      { name: 'Prescriptions', path: 'prescriptions', element: <Prescriptions /> },
      { name: 'Feedback', path: 'feedback', element: <FeedbackPage /> },
    ],
  },

  // Doctor Routes
  {
    name: 'Doctor',
    path: '/doctor',
    element: <DashboardLayout />,
    children: [
      { name: 'Doctor Dashboard', path: '', element: <DoctorDashboard /> },
      { name: 'Appointments', path: 'appointments', element: <AppointmentList /> },
      { name: 'Prescriptions', path: 'prescriptions', element: <UploadPrescription /> },
    ],
  },

  // Admin Routes
  {
    name: 'Admin',
    path: '/admin',
    element: <DashboardLayout />,
    children: [
      { name: 'Admin Dashboard', path: '', element: <AdminDashboard /> },
      { name: 'Departments', path: 'departments', element: <DepartmentManagement /> },
      { name: 'Approvals', path: 'approvals', element: <DoctorApprovals /> },
      { name: 'Users', path: 'users', element: <UserManagement /> },
    ],
  },
];

export default routes;
