import { useWatershed } from '@/app/context/WatershedContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Image, Video, Music, Code } from 'lucide-react';

const DashboardPage = () => {
  const { projects, media } = useWatershed();

  // Media type distribution
  const mediaTypeData = [
    { name: 'Documents', value: media.filter(m => m.type === 'document').length, color: '#3B82F6' },
    { name: 'Images', value: media.filter(m => m.type === 'image').length, color: '#60A5FA' },
    { name: 'Videos', value: media.filter(m => m.type === 'video').length, color: '#93C5FD' },
    { name: 'Audio', value: media.filter(m => m.type === 'audio').length, color: '#DBEAFE' },
    { name: 'Code', value: media.filter(m => m.type === 'code').length, color: '#2563EB' },
  ];

  // Media by project
  const projectData = projects.map(project => ({
    name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
    count: media.filter(m => m.projectId === project.id).length,
  }));

  // Top tags
  const tagCounts = media.reduce((acc, item) => {
    item.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'code': return Code;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your digital watershed</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Total Projects</div>
            <div className="text-3xl font-bold text-blue-900">{projects.length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Total Media</div>
            <div className="text-3xl font-bold text-blue-900">{media.length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Unique Tags</div>
            <div className="text-3xl font-bold text-blue-900">{Object.keys(tagCounts).length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Avg Tags/Media</div>
            <div className="text-3xl font-bold text-blue-900">
              {media.length > 0 ? (media.reduce((acc, m) => acc + m.tags.length, 0) / media.length).toFixed(1) : 0}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Media by Type */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Media Distribution by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mediaTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mediaTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Media by Project */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Media by Project</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Tags and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tags */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Top Tags</h2>
            <div className="space-y-3">
              {topTags.map((item, index) => (
                <div key={item.tag} className="flex items-center gap-4">
                  <div className="text-sm font-medium text-blue-600 w-6">{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.tag}</span>
                      <span className="text-sm font-medium text-blue-900">{item.count}</span>
                    </div>
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.count / Math.max(...topTags.map(t => t.count))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Type Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Media Type Breakdown</h2>
            <div className="space-y-4">
              {mediaTypeData.map((type) => {
                const Icon = getMediaIcon(type.name.toLowerCase().replace('s', ''));
                return (
                  <div key={type.name} className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: type.color + '20' }}
                    >
                      <Icon className="size-5" style={{ color: type.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{type.name}</span>
                        <span className="text-sm font-medium text-blue-900">{type.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${media.length > 0 ? (type.value / media.length) * 100 : 0}%`,
                            backgroundColor: type.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
