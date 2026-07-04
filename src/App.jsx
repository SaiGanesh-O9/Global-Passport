import { RouterProvider } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentProvider.jsx';
import { router } from './router/AppRouter.jsx';

export default function App() {
  return (
    <DocumentProvider>
      <RouterProvider router={router} />
    </DocumentProvider>
  );
}
