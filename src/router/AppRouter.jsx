import { createBrowserRouter } from 'react-router-dom';
import InstitutionDashboard from '../pages/InstitutionDashboard.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import NotFound from '../pages/NotFound.jsx';
import UserDashboard from '../pages/UserDashboard.jsx';
import VerificationPage from '../pages/VerificationPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/dashboard',
    element: <UserDashboard />,
  },
  {
    path: '/institution',
    element: <InstitutionDashboard />,
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
