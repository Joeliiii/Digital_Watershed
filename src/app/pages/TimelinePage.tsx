import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getMediaIcon, getTypeColor, getMediaLabel } from '../utils/mediaUtils';
import {
  Calendar,
  Filter,
  ChevronDown,
  Clock,
  FolderOpen,
  TrendingUp,
  Layers,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────

/** Group items by date bucket (day), returning sorted array */
function buildCumulativeData(
  items: any[],
  projects: any[],
  selectedProjectId: string | null
) {
  const filtered = selectedProjectId
    ? items.filter((m) =>
        m.projectIds?.some(
          (p: any) =>
            (typeof p === 'string' ? p : p._id) === selectedProjectId
        )
      )
    : items;

  if (filtered.length === 0) return [];

  // Sort by date ascending
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Build per-day buckets
  const buckets: Record<string, { date: string; count: number; cumulative: number }> = {};
  sorted.forEach((item) => {
    const d = new Date(item.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!buckets[key]) {
      buckets[key] = { date: key, count: 0, cumulative: 0 };
    }
    buckets[key].count++;
  });

  // Compute cumulative
  const result = Object.values(buckets).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let running = 0;
  result.forEach((b) => {
    running += b.count;
    b.cumulative = running;
  });

  return result;
}

/** Format a date string into a readable label */
function formatDate(dateStr: string, style: 'short' | 'full' = 'short') {
  const d = new Date(dateStr);
  if (style === 'full') {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ─── Component ─────────────────────────────────────────────────

const TimelinePage = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaData, projectsData] = await Promise.all([
          api.getItems(),
          api.getProjects(),
        ]);
        setMedia(mediaData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load timeline data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Derived data ──────────────────────────────────────────

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  const filteredMedia = useMemo(() => {
    const items = selectedProjectId
      ? media.filter((m) =>
          m.projectIds?.some(
            (p: any) =>
              (typeof p === 'string' ? p : p._id) === selectedProjectId
          )
        )
      : media;
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [media, selectedProjectId]);

  const chartData = useMemo(
    () => buildCumulativeData(media, projects, selectedProjectId),
    [media, projects, selectedProjectId]
  );

  const chartColor = selectedProject?.color || '#3B82F6';

  // Stats
  const totalItems = filteredMedia.length;
  const dateRange = useMemo(() => {
    if (filteredMedia.length === 0) return null;
    const sorted = [...filteredMedia].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return {
      first: sorted[0].createdAt,
      last: sorted[sorted.length - 1].createdAt,
    };
  }, [filteredMedia]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMedia.forEach((item) => {
      const cat = item.metadata?.mimetype || item.mediaType || 'other';
      const label = getMediaLabel(cat);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredMedia]);

  // Group timeline items by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredMedia.forEach((item) => {
      const d = new Date(item.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredMedia]);

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-8">
        {/* ─── Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-1 flex items-center gap-3">
              <Calendar className="size-8" />
              Timeline
            </h1>
            <p className="text-gray-500">
              {selectedProject
                ? `Viewing timeline for "${selectedProject.title || selectedProject.name}"`
                : 'Showing activity across all projects'}
            </p>
          </div>

          {/* Project Selector */}
          <div className="relative">
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-sm hover:bg-blue-50 transition-colors shadow-sm"
            >
              {selectedProject ? (
                <>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color || '#3B82F6' }}
                  />
                  <span className="text-blue-900 font-medium max-w-[180px] truncate">
                    {selectedProject.title || selectedProject.name}
                  </span>
                </>
              ) : (
                <>
                  <Filter className="size-4 text-blue-500" />
                  <span className="text-blue-700 font-medium">All Projects</span>
                </>
              )}
              <ChevronDown className="size-3.5 text-gray-400" />
            </button>

            {projectDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProjectDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-blue-100 py-1 w-64 max-h-80 overflow-auto">
                  <button
                    onClick={() => {
                      setSelectedProjectId(null);
                      setProjectDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                      !selectedProjectId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <Layers className="size-4 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium">All Projects</div>
                      <div className="text-[11px] text-gray-400">
                        {media.length} total items
                      </div>
                    </div>
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  {projects.map((project) => {
                    const count = media.filter((m) =>
                      m.projectIds?.some(
                        (p: any) =>
                          (typeof p === 'string' ? p : p._id) === project._id
                      )
                    ).length;
                    return (
                      <button
                        key={project._id}
                        onClick={() => {
                          setSelectedProjectId(project._id);
                          setProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                          selectedProjectId === project._id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color || '#3B82F6' }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {project.title || project.name}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {count} item{count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {projects.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-400">No projects yet</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── Stats Row ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Layers className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{totalItems}</div>
              <div className="text-xs text-gray-500">Total Items</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {typeCounts.length > 0 ? typeCounts[0][0] : '—'}
              </div>
              <div className="text-xs text-gray-500">Most Common Type</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100 text-violet-600">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {dateRange
                  ? `${formatDate(dateRange.first)} – ${formatDate(dateRange.last)}`
                  : '—'}
              </div>
              <div className="text-xs text-gray-500">Date Range</div>
            </div>
          </div>
        </div>

        {/* ─── Growth Chart ──────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-1">Growth Over Time</h2>
          <p className="text-xs text-gray-400 mb-4">
            Cumulative items added{selectedProject ? ` to "${selectedProject.title || selectedProject.name}"` : ''}
          </p>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(v) => formatDate(v)}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  labelFormatter={(v) => formatDate(v, 'full')}
                  formatter={(value: number, name: string) => {
                    if (name === 'cumulative') return [value, 'Total Items'];
                    return [value, 'Added This Day'];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fill="url(#chartGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: chartColor,
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : chartData.length === 1 ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: chartColor + '20' }}
                >
                  <TrendingUp className="size-7" style={{ color: chartColor }} />
                </div>
                <div className="text-2xl font-bold text-blue-900 mb-1">
                  {chartData[0].cumulative} item{chartData[0].cumulative !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-400">
                  All added on {formatDate(chartData[0].date, 'full')}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
              No items to display
            </div>
          )}
        </div>

        {/* ─── Vertical Timeline ─────────────────────────── */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-1">Activity Feed</h2>
          <p className="text-xs text-gray-400">
            {filteredMedia.length} item{filteredMedia.length !== 1 ? 's' : ''} sorted by newest first
          </p>
        </div>

        {groupedByDate.length > 0 ? (
          <div className="relative">
            {/* Timeline spine */}
            <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-blue-100 to-transparent" />

            <div className="space-y-8">
              {groupedByDate.map(([dateKey, items]) => (
                <div key={dateKey} className="relative">
                  {/* Date badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative z-10 w-[47px] h-[47px] rounded-full bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm">
                      <Calendar className="size-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-blue-900">
                        {formatDate(dateKey, 'full')}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {items.length} item{items.length !== 1 ? 's' : ''} added
                      </div>
                    </div>
                  </div>

                  {/* Items for this date */}
                  <div className="ml-[59px] space-y-2">
                    {items.map((item: any) => {
                      const mimeType = item.metadata?.mimetype || item.mediaType;
                      const Icon = getMediaIcon(mimeType);
                      const itemProject = item.projectIds?.[0];
                      const project = itemProject
                        ? projects.find(
                            (p) =>
                              p._id ===
                              (typeof itemProject === 'string'
                                ? itemProject
                                : itemProject._id)
                          )
                        : null;

                      return (
                        <div
                          key={item._id}
                          className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${getTypeColor(mimeType)}`}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {item.title}
                                </h4>
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500 line-clamp-1 mb-1.5">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                <span>{getMediaLabel(mimeType)}</span>
                                {project && (
                                  <span className="flex items-center gap-1">
                                    <FolderOpen className="size-3" />
                                    {project.title || project.name}
                                  </span>
                                )}
                                <span>{formatTimeAgo(item.createdAt)}</span>
                              </div>
                              {/* Tags */}
                              {item.tagIds && item.tagIds.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tagIds.slice(0, 4).map((tag: any) => {
                                    const name =
                                      typeof tag === 'string' ? tag : tag?.name;
                                    if (!name) return null;
                                    return (
                                      <span
                                        key={typeof tag === 'string' ? tag : tag._id}
                                        className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-medium"
                                      >
                                        {name}
                                      </span>
                                    );
                                  })}
                                  {item.tagIds.length > 4 && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">
                                      +{item.tagIds.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Project color indicator */}
                            {project && (
                              <div
                                className="w-1.5 h-10 rounded-full shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                style={{
                                  backgroundColor: project.color || '#3B82F6',
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="size-12 text-blue-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 mb-1">No Activity</h3>
            <p className="text-sm text-gray-400">
              {selectedProject
                ? `No items have been added to "${selectedProject.title || selectedProject.name}" yet.`
                : 'No items have been created yet. Upload some media to see your timeline.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePage;
