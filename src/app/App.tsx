import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WatershedProvider } from '@/app/context/WatershedContext';
import Navigation from '@/app/components/Navigation';
import HomePage from '@/app/pages/HomePage';
import CreateProjectPage from '@/app/pages/CreateProjectPage';
import TaggingPage from '@/app/pages/TaggingPage';
import DashboardPage from '@/app/pages/DashboardPage';
import MediaPage from '@/app/pages/MediaPage';
import NetworkGraphPage from '@/app/pages/NetworkGraphPage';

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
            <Route path="/create-project" element={<CreateProjectPage />} />
            <Route path="/tagging" element={<TaggingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/network" element={<NetworkGraphPage />} />
          </Routes>
        </div>
      </Router>
    </WatershedProvider>
  );
}
