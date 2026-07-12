import React, { Suspense } from 'react';
import { createBrowserRouter, useRouteError } from 'react-router-dom';
import RoleProtectedRoute from '../components/layout/RoleProtectedRoute.jsx';
import RoleBasedLayoutWrapper from '../components/layout/RoleBasedLayoutWrapper.jsx';

// Lazy loading views for high performance boundaries
const LandingPage = React.lazy(() => import('../pages/LandingPage.jsx'));
const Login = React.lazy(() => import('../pages/Login.jsx'));
const NotFound = React.lazy(() => import('../pages/NotFound.jsx'));
const AccessDenied = React.lazy(() => import('../pages/AccessDenied.jsx'));
const VerificationPage = React.lazy(() => import('../pages/VerificationPage.jsx'));
const AdminPortal = React.lazy(() => import('../pages/AdminPortal.jsx'));
const UserDashboard = React.lazy(() => import('../pages/UserDashboard.jsx'));
const InstitutionDashboard = React.lazy(() => import('../pages/InstitutionDashboard.jsx'));
const DebugPage = React.lazy(() => import('../pages/DebugPage.jsx'));

import { 
  LayoutDashboard, Building2, Shield, FileText, Activity, User, Settings,
  BarChart3, Layers, ClipboardList, ShieldAlert 
} from 'lucide-react';

const userNavItems = [
  { label: 'My Workspace', to: '/dashboard#dashboard', icon: LayoutDashboard },
  { label: 'Organizations', to: '/dashboard#organizations', icon: Building2 },
  { label: 'Credential Vault™', to: '/dashboard#vault', icon: Shield },
  { label: 'Active Verifications', to: '/dashboard#requests', icon: FileText },
  { label: 'Timeline™', to: '/dashboard#activity', icon: Activity },
  { label: 'Profile', to: '/dashboard#profile', icon: User },
  { label: 'Settings', to: '/dashboard#settings', icon: Settings },
];

const institutionNavItems = [
  { label: 'My Workspace', to: '/institution#dashboard', icon: BarChart3 },
  { label: 'Verification Services', to: '/institution#services', icon: Layers },
  { label: 'Credential Templates', to: '/institution#templates', icon: ClipboardList },
  { label: 'Active Verifications', to: '/institution#requests', icon: ShieldAlert },
  { label: 'Profile', to: '/institution#profile', icon: User },
  { label: 'Settings', to: '/institution#settings', icon: Settings },
];

function LazyWrapper({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] flex items-center justify-center transition-theme">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  );
}

function UserDashboardWithLayout() {
  return (
    <RoleBasedLayoutWrapper
      navItems={userNavItems}
      title="My Workspace"
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
      title="My Workspace"
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
      <div className="max-w-md bg-white dark:bg-[#12131a] border border-slate-205 dark:border-slate-800 p-8 rounded-2xl shadow-xl space-y-4">
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
    element: <LazyWrapper><LandingPage /></LazyWrapper>,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/login',
    element: <LazyWrapper><Login /></LazyWrapper>,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/403',
    element: <LazyWrapper><AccessDenied /></LazyWrapper>,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/admin',
    element: (
      <RoleProtectedRoute allowedRoles={['super_admin']}>
        <LazyWrapper><AdminPortal /></LazyWrapper>
      </RoleProtectedRoute>
    ),
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/dashboard',
    element: (
      <RoleProtectedRoute allowedRoles={['student', 'employer', 'super_admin']}>
        <LazyWrapper><UserDashboardWithLayout /></LazyWrapper>
      </RoleProtectedRoute>
    ),
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/institution',
    element: (
      <RoleProtectedRoute allowedRoles={['organization', 'super_admin']}>
        <LazyWrapper><InstitutionDashboardWithLayout /></LazyWrapper>
      </RoleProtectedRoute>
    ),
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/verify/:verificationId?',
    element: <LazyWrapper><VerificationPage /></LazyWrapper>,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '/debug',
    element: <LazyWrapper><DebugPage /></LazyWrapper>,
    errorElement: <RootErrorBoundary />
  },
  {
    path: '*',
    element: <LazyWrapper><NotFound /></LazyWrapper>,
  },
]);
