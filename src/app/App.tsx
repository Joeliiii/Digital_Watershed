import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WatershedProvider } from '@/app/context/WatershedContext';
import Navigation from '@/app/components/Navigation';
import HomePage from '@/app/pages/HomePage';
import CreateProjectPage from '@/app/pages/CreateProjectPage';
import TaggingPage from '@/app/pages/TaggingPage';
import DashboardPage from '@/app/pages/DashboardPage';
import MediaPage from '@/app/pages/MediaPage';
import CreateMediaPage from '@/app/pages/CreateMediaPage';
import BulkUploadPage from '@/app/pages/BulkUploadPage';
import MediaDetailPage from '@/app/pages/MediaDetailPage';
import NetworkGraphPage from '@/app/pages/NetworkGraphPage';
import SharedProjectPage from '@/app/pages/SharedProjectPage';

import LoginPage from '@/app/pages/LoginPage';
import BatchTagging from './components/BatchTagging';
import RecentlyViewed from './components/RecentlyViewed';

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
            <Route path="/batch-tagging" element={<BatchTagging />} />
            <Route path="/recently-viewed" element={<RecentlyViewed />} />
            <Route path="/create-project" element={<CreateProjectPage />} />
            <Route path="/network" element={<NetworkGraphPage />} />
            <Route path="/shared/:token" element={<SharedProjectPage />} />
          </Routes>
        </div>
      </Router>
    </WatershedProvider>
  );
}
