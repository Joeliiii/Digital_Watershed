import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMediaCategory, getMediaIcon, getMediaLabel } from '../utils/mediaUtils';

const CATEGORY_COLORS: Record<string, string> = {
  document: '#3B82F6',
  image: '#8B5CF6',
  video: '#EF4444',
  audio: '#F59E0B',
  code: '#10B981',
  other: '#6B7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  document: 'Documents',
  image: 'Images',
  video: 'Videos',
  audio: 'Audio',
  code: 'Code',
  other: 'Other',
};

const DashboardPage = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaData, projectsData, tagsData] = await Promise.all([
          api.getItems(),
          api.getProjects(),
          api.getTags(),
        ]);
        setMedia(mediaData);
        setProjects(projectsData);
        setTags(tagsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Media type distribution (by MIME category)
  const mediaTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    media.forEach(item => {
      const cat = getMediaCategory(item.metadata?.mimetype || item.mediaType);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([category, value]) => ({
      name: CATEGORY_LABELS[category] || category,
      value,
      color: CATEGORY_COLORS[category] || '#6B7280',
      category,
    }));
  }, [media]);

  // Media per project
  const projectData = useMemo(() => {
    return projects.map(project => ({
      name: (project.title || project.name || '').length > 20
        ? (project.title || project.name || '').substring(0, 20) + '...'
        : (project.title || project.name || ''),
      count: media.filter(m =>
        m.projectIds?.some((p: any) => (typeof p === 'string' ? p : p._id) === project._id)
      ).length,
    }));
  }, [projects, media]);

  // Tag usage counts
  const tagUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    media.forEach(item => {
      item.tagIds?.forEach((tag: any) => {
        const name = typeof tag === 'string' ? tag : tag.name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return counts;
  }, [media]);

  const topTags = useMemo(() => {
    return Object.entries(tagUsageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [tagUsageCounts]);

  const totalTags = tags.length;
  const avgTagsPerMedia = media.length > 0
    ? (media.reduce((acc, m) => acc + (m.tagIds?.length || 0), 0) / media.length).toFixed(1)
    : '0';

  if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

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
            <div className="text-sm text-gray-600 mb-1">Total Tags</div>
            <div className="text-3xl font-bold text-blue-900">{totalTags}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Avg Tags/Media</div>
            <div className="text-3xl font-bold text-blue-900">{avgTagsPerMedia}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Media by Type */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Media Distribution by Type</h2>
            {mediaTypeData.length > 0 ? (
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">No media yet</div>
            )}
          </div>

          {/* Media by Project */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Media by Project</h2>
            {projectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">No projects yet</div>
            )}
          </div>
        </div>

        {/* Top Tags and Media Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tags */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Top Tags</h2>
            <div className="space-y-3">
              {topTags.length > 0 ? topTags.map((item, index) => (
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
              )) : (
                <p className="text-gray-400 text-sm">No tags in use yet</p>
              )}
            </div>
          </div>

          {/* Media Type Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Media Type Breakdown</h2>
            <div className="space-y-4">
              {mediaTypeData.length > 0 ? mediaTypeData.map((type) => {
                const Icon = getMediaIcon(type.category);
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
              }) : (
                <p className="text-gray-400 text-sm">No media yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
