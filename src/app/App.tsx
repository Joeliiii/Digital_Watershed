import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { WatershedProvider } from '@/app/context/WatershedContext';
import Navigation from '@/app/components/Navigation';
import HomePage from '@/app/pages/HomePage';
import ProjectsPage from '@/app/pages/ProjectsPage';
import TaggingPage from '@/app/pages/TaggingPage';
import DashboardPage from '@/app/pages/DashboardPage';
import MediaPage from '@/app/pages/MediaPage';
import CreateMediaPage from '@/app/pages/CreateMediaPage';
import BulkUploadPage from '@/app/pages/BulkUploadPage';
import MediaDetailPage from '@/app/pages/MediaDetailPage';
import NetworkGraphPage from '@/app/pages/NetworkGraphPage';
import SharedProjectPage from '@/app/pages/SharedProjectPage';
import TimelinePage from '@/app/pages/TimelinePage';
import AdminPage from '@/app/pages/AdminPage';

import LoginPage from '@/app/pages/LoginPage';

function AppLayout() {
  const location = useLocation();
  const isLoginRoute = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen bg-white">
      {!isLoginRoute && <Navigation />}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tagging" element={<TaggingPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/media/create" element={<CreateMediaPage />} />
        <Route path="/media/bulk-upload" element={<BulkUploadPage />} />
        <Route path="/media/:id" element={<MediaDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/network" element={<NetworkGraphPage />} />
        <Route path="/shared/:token" element={<SharedProjectPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <WatershedProvider>
      <Router>
        <AppLayout />
      </Router>
    </WatershedProvider>
  );
}
