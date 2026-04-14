import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

import LoginPage from '@/app/pages/LoginPage';

export default function App() {
  return (
    <WatershedProvider>
      <Router>
        <div className="min-h-screen bg-white">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
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
          </Routes>
        </div>
      </Router>
    </WatershedProvider>
  );
}
