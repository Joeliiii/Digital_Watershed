import { Link } from 'react-router-dom';
import { FolderPlus, Database, Network, BarChart3 } from 'lucide-react';
import { useWatershed } from '@/app/context/WatershedContext';

const HomePage = () => {
  const { projects, media } = useWatershed();

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderPlus, color: 'bg-blue-100 text-blue-600' },
    { label: 'Media Items', value: media.length, icon: Database, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Tags', value: new Set(media.flatMap(m => m.tags)).size, icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
    { label: 'Connections', value: media.reduce((acc, m) => acc + m.relatedMedia.length, 0), icon: Network, color: 'bg-blue-100 text-blue-600' },
  ];

  const quickActions = [
    { title: 'Create New Project', description: 'Start organizing a new research project', link: '/create-project', icon: FolderPlus },
    { title: 'Browse Media', description: 'Search and filter your media library', link: '/media', icon: Database },
    { title: 'View Network', description: 'Explore connections between media items', link: '/network', icon: Network },
    { title: 'Dashboard', description: 'View analytics and insights', link: '/dashboard', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            Digital Watershed
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A comprehensive system for organizing, preserving, and visualizing multi-modal research data
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="size-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.link}
                  className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="size-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">{action.title}</h3>
                      <p className="text-gray-600 text-sm">{action.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.slice(0, 4).map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-blue-100"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">{project.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                    <div className="text-xs text-gray-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
