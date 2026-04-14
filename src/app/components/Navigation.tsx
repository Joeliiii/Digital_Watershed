import { Link, useLocation } from 'react-router-dom';
import { Home, FolderPlus, Tags, LayoutDashboard, Database, Network, Calendar, Shield } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/projects', label: 'Projects', icon: FolderPlus },
    { path: '/tagging', label: 'Tagging', icon: Tags },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/media', label: 'Media', icon: Database },
    { path: '/network', label: 'Network Graph', icon: Network },
    { path: '/timeline', label: 'Timeline', icon: Calendar },
    { path: '/admin', label: 'Admin', icon: Shield },
  ];

  return (
    <nav className="bg-white border-b border-blue-100">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Network className="size-8 text-blue-600" />
            <span className="text-xl font-semibold text-blue-900">Digital Watershed</span>
          </div>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
