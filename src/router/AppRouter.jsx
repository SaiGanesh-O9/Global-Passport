import { createBrowserRouter } from 'react-router-dom';
import InstitutionDashboard from '../pages/InstitutionDashboard.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import NotFound from '../pages/NotFound.jsx';
import UserDashboard from '../pages/UserDashboard.jsx';
import VerificationPage from '../pages/VerificationPage.jsx';
import AccessDenied from '../pages/AccessDenied.jsx';
import Login from '../pages/Login.jsx';
import RoleProtectedRoute from '../components/layout/RoleProtectedRoute.jsx';

import AdminPortal from '../pages/AdminPortal.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/403',
    element: <AccessDenied />,
  },
  {
    path: '/admin',
    element: (
      <RoleProtectedRoute allowedRoles={['super_admin']}>
        <AdminPortal />
      </RoleProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <RoleProtectedRoute allowedRoles={['student', 'employer', 'super_admin']}>
        <UserDashboard />
      </RoleProtectedRoute>
    ),
  },
  {
    path: '/institution',
    element: (
      <RoleProtectedRoute allowedRoles={['organization', 'super_admin']}>
        <InstitutionDashboard />
      </RoleProtectedRoute>
    ),
  },
  {
    path: '/verify/:verificationId?',
    element: <VerificationPage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
