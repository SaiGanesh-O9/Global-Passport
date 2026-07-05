import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import InstitutionDashboard, { institutionNavItems } from '../pages/InstitutionDashboard.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import NotFound from '../pages/NotFound.jsx';
import UserDashboard, { userNavItems } from '../pages/UserDashboard.jsx';
import VerificationPage from '../pages/VerificationPage.jsx';
import AccessDenied from '../pages/AccessDenied.jsx';
import Login from '../pages/Login.jsx';
import RoleProtectedRoute from '../components/layout/RoleProtectedRoute.jsx';
import RoleBasedLayoutWrapper from '../components/layout/RoleBasedLayoutWrapper.jsx';
import AdminPortal from '../pages/AdminPortal.jsx';

function UserDashboardWithLayout() {
  return (
    <RoleBasedLayoutWrapper
      navItems={userNavItems}
      title="User Dashboard"
      subtitle="Manage verification requests and share verified credentials."
    >
      <UserDashboard />
    </RoleBasedLayoutWrapper>
  );
}

function InstitutionDashboardWithLayout() {
  return (
    <RoleBasedLayoutWrapper
      navItems={institutionNavItems}
      title="Organization Verification Center"
      subtitle="Review verification requests from verified platform users."
    >
      <InstitutionDashboard />
    </RoleBasedLayoutWrapper>
  );
}

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
        <UserDashboardWithLayout />
      </RoleProtectedRoute>
    ),
  },
  {
    path: '/institution',
    element: (
      <RoleProtectedRoute allowedRoles={['organization', 'super_admin']}>
        <InstitutionDashboardWithLayout />
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
