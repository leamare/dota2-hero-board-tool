import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AboutPage from './pages/AboutPage';
import ViewPage from './pages/ViewPage';
import EditPage from './pages/EditPage';
import ImportPage from './pages/ImportPage';
import LayoutsPage from './pages/LayoutsPage';
import { MetadataProvider } from './state/MetadataProvider';

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/view" replace /> },
      { path: 'view', element: <ViewPage /> },
      { path: 'edit', element: <EditPage /> },
      { path: 'import', element: <ImportPage /> },
      { path: 'layouts', element: <LayoutsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <Navigate to="/view" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <MetadataProvider>
      <RouterProvider router={router} />
    </MetadataProvider>
  );
}
