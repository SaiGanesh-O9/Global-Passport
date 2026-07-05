import React from 'react';
import { createBrowserRouter, useRouteError } from 'react-router-dom';
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

function RootErrorBoundary() {
  const error = useRouteError();
  console.error("Route Crash Boundary:", error);
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] flex items-center justify-center p-6 text-center select-none transition-theme">
      <div className="max-w-md bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl space-y-4">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Unexpected Application Error</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          UniCrypt encountered a runtime interruption. Rest assured, your credentials vault is safe.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-xs font-bold text-white rounded-lg shadow cursor-pointer transition-all border-none outline-none focus:ring-2 focus:ring-blue-500"
        >
          Return to Home View
        </button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/login',
    element: <Login />,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/403',
    element: <AccessDenied />,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/admin',
    element: (
      <RoleProtectedRoute allowedRoles={['super_admin']}>
        <AdminPortal />
      </RoleProtectedRoute>
    ),
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/dashboard',
    element: (
      <RoleProtectedRoute allowedRoles={['student', 'employer', 'super_admin']}>
        <UserDashboardWithLayout />
      </RoleProtectedRoute>
    ),
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/institution',
    element: (
      <RoleProtectedRoute allowedRoles={['organization', 'super_admin']}>
        <InstitutionDashboardWithLayout />
      </RoleProtectedRoute>
    ),
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/verify/:verificationId?',
    element: <VerificationPage />,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
