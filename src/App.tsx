import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AboutPage from './pages/AboutPage';
import { MetadataProvider, useMetadataState } from './state/MetadataProvider';

function MetadataStatus() {
  const { data, error } = useMetadataState();
  if (error) return <div className="text-panel">Failed to load metadata: {error}</div>;
  if (!data) return <div className="text-panel">Loading hero metadata…</div>;
  return (
    <div className="text-panel">
      Loaded {data.heroes.length} heroes and {data.items.length} items.
    </div>
  );
}

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/view" replace /> },
      { path: 'view', element: <MetadataStatus /> },
      { path: 'edit', element: <div className="text-panel">Board editor — coming soon.</div> },
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
