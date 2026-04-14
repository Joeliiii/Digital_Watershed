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
  Plus,
  Trash2,
  Edit,
  Unlink,
  Link,
  RefreshCw,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────

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

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const buckets: Record<string, { date: string; count: number; cumulative: number }> = {};
  sorted.forEach((item) => {
    const d = new Date(item.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!buckets[key]) {
      buckets[key] = { date: key, count: 0, cumulative: 0 };
    }
    buckets[key].count++;
  });

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

function getDateKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Unified event types for the timeline
interface TimelineEvent {
  id: string;
  type: 'media_added' | 'add_to_project' | 'remove_from_project' | 'create' | 'update' | 'delete';
  timestamp: string;
  title: string;
  description?: string;
  mediaType?: string;
  projectTitle?: string;
  projectColor?: string;
  projectId?: string;
  itemId?: string;
  tags?: any[];
}

const actionConfig: Record<string, { icon: any; label: string; colorClass: string; bgClass: string }> = {
  media_added: { icon: Plus, label: 'Media added', colorClass: 'text-blue-600', bgClass: 'bg-blue-100' },
  create: { icon: Plus, label: 'Created', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
  add_to_project: { icon: Link, label: 'Added to project', colorClass: 'text-green-600', bgClass: 'bg-green-100' },
  remove_from_project: { icon: Unlink, label: 'Removed from project', colorClass: 'text-orange-600', bgClass: 'bg-orange-100' },
  update: { icon: Edit, label: 'Updated', colorClass: 'text-indigo-600', bgClass: 'bg-indigo-100' },
  delete: { icon: Trash2, label: 'Deleted', colorClass: 'text-red-600', bgClass: 'bg-red-100' },
};

// ─── Component ─────────────────────────────────────────────────

const TimelinePage = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [showEventTypes, setShowEventTypes] = useState<Record<string, boolean>>({
    media_added: true,
    add_to_project: true,
    remove_from_project: true,
    create: true,
    update: false, // hide generic updates by default
    delete: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaData, projectsData, auditData] = await Promise.all([
          api.getItems(),
          api.getProjects(),
          api.getAuditLogs({ limit: 100 }),
        ]);
        setMedia(mediaData);
        setProjects(projectsData);
        setAuditLogs(auditData.logs || []);
      } catch (error) {
        console.error('Failed to load timeline data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Build unified timeline events ─────────────────────────

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];
    const projectMap = new Map(projects.map((p) => [p._id, p]));

    // Media creation events
    media.forEach((item) => {
      const itemProjectIds = (item.projectIds || []).map((p: any) =>
        typeof p === 'string' ? p : p._id
      );

      // If filtering by project, only include if item belongs to that project
      if (selectedProjectId && !itemProjectIds.includes(selectedProjectId)) return;

      const project = itemProjectIds[0] ? projectMap.get(itemProjectIds[0]) : null;

      events.push({
        id: `media-${item._id}`,
        type: 'media_added',
        timestamp: item.createdAt,
        title: item.title,
        description: item.description,
        mediaType: item.metadata?.mimetype || item.mediaType,
        projectTitle: project?.title || project?.name,
        projectColor: project?.color,
        projectId: project?._id,
        itemId: item._id,
        tags: item.tagIds,
      });
    });

    // Audit log events (add_to_project, remove_from_project, delete, etc.)
    auditLogs.forEach((log) => {
      // Skip generic 'create' logs for Items — we already have media_added events
      if (log.actionType === 'create' && log.targetType === 'Item') return;
      // Skip generic 'update' logs for Items — we show those only if toggled
      if (log.actionType === 'update' && log.targetType === 'Item') return;

      // Filter by project for project-specific events
      if (selectedProjectId) {
        if (
          (log.actionType === 'add_to_project' || log.actionType === 'remove_from_project') &&
          log.details?.projectId !== selectedProjectId
        ) {
          return;
        }
        // For non-project-specific events like delete, still show if they involved items
        // that belonged to the selected project — but we can't easily know, so show all
      }

      const project = log.details?.projectId ? projectMap.get(log.details.projectId) : null;

      events.push({
        id: `audit-${log._id}`,
        type: log.actionType as TimelineEvent['type'],
        timestamp: log.timestamp,
        title: log.details?.title || log.details?.projectTitle || log.targetType,
        description: getEventDescription(log),
        projectTitle: log.details?.projectTitle || project?.title,
        projectColor: project?.color,
        projectId: log.details?.projectId,
        itemId: log.targetType === 'Item' ? log.targetId : undefined,
      });
    });

    // Sort newest first
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by visible event types
    return events.filter((e) => showEventTypes[e.type] !== false);
  }, [media, auditLogs, projects, selectedProjectId, showEventTypes]);

  function getEventDescription(log: any): string {
    switch (log.actionType) {
      case 'add_to_project':
        return `Added to "${log.details?.projectTitle || 'project'}"`;
      case 'remove_from_project':
        return `Removed from "${log.details?.projectTitle || 'project'}"`;
      case 'delete':
        return `${log.targetType} deleted`;
      case 'create':
        return `${log.targetType} created`;
      case 'update':
        return `${log.targetType} updated`;
      default:
        return log.actionType;
    }
  }

  // Group events by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    timelineEvents.forEach((event) => {
      const key = getDateKey(event.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return Object.entries(groups).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [timelineEvents]);

  // Chart data — still based on media items for cumulative growth
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
  const totalItems = filteredMedia.length;

  const dateRange = useMemo(() => {
    if (filteredMedia.length === 0) return null;
    const sorted = [...filteredMedia].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return { first: sorted[0].createdAt, last: sorted[sorted.length - 1].createdAt };
  }, [filteredMedia]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMedia.forEach((item) => {
      const cat = item.metadata?.mimetype || item.mediaType || 'other';
      const label = getMediaLabel(cat);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
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

        {/* ─── Event Type Filters ─────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-1">Activity Feed</h2>
            <p className="text-xs text-gray-400">
              {timelineEvents.length} event{timelineEvents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(actionConfig).map(([type, config]) => {
              const Icon = config.icon;
              const active = showEventTypes[type] !== false;
              return (
                <button
                  key={type}
                  onClick={() =>
                    setShowEventTypes((prev) => ({ ...prev, [type]: !prev[type] }))
                  }
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    active
                      ? `${config.bgClass} ${config.colorClass} border-transparent`
                      : 'bg-white text-gray-400 border-gray-200 opacity-60'
                  }`}
                >
                  <Icon className="size-3" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Vertical Timeline ─────────────────────────── */}
        {groupedByDate.length > 0 ? (
          <div className="relative">
            {/* Timeline spine */}
            <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-blue-100 to-transparent" />

            <div className="space-y-8">
              {groupedByDate.map(([dateKey, events]) => {
                // Count event types for this day
                const addCount = events.filter((e) => e.type === 'media_added' || e.type === 'create').length;
                const removeCount = events.filter((e) => e.type === 'remove_from_project').length;
                const otherCount = events.length - addCount - removeCount;

                const daySummaryParts: string[] = [];
                if (addCount > 0) daySummaryParts.push(`${addCount} added`);
                if (removeCount > 0) daySummaryParts.push(`${removeCount} removed`);
                if (otherCount > 0) daySummaryParts.push(`${otherCount} other`);

                return (
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
                          {daySummaryParts.join(' · ')}
                        </div>
                      </div>
                    </div>

                    {/* Events for this date */}
                    <div className="ml-[59px] space-y-2">
                      {events.map((event) => {
                        const config = actionConfig[event.type] || actionConfig.create;
                        const Icon = event.type === 'media_added' && event.mediaType
                          ? getMediaIcon(event.mediaType)
                          : config.icon;
                        const colorClasses = event.type === 'media_added' && event.mediaType
                          ? getTypeColor(event.mediaType)
                          : `${config.bgClass} ${config.colorClass}`;

                        return (
                          <div
                            key={event.id}
                            className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg shrink-0 ${colorClasses}`}>
                                <Icon className="size-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                                    {event.title}
                                  </h4>
                                  {/* Event type badge for non-media events */}
                                  {event.type !== 'media_added' && (
                                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${config.bgClass} ${config.colorClass}`}>
                                      {config.label}
                                    </span>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-xs text-gray-500 line-clamp-1 mb-1.5">
                                    {event.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                  {event.mediaType && (
                                    <span>{getMediaLabel(event.mediaType)}</span>
                                  )}
                                  {event.projectTitle && (
                                    <span className="flex items-center gap-1">
                                      <FolderOpen className="size-3" />
                                      {event.projectTitle}
                                    </span>
                                  )}
                                  <span>{formatTimeAgo(event.timestamp)}</span>
                                </div>
                                {/* Tags */}
                                {event.tags && event.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {event.tags.slice(0, 4).map((tag: any) => {
                                      const name = typeof tag === 'string' ? tag : tag?.name;
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
                                    {event.tags.length > 4 && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">
                                        +{event.tags.length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Project color indicator */}
                              {event.projectColor && (
                                <div
                                  className="w-1.5 h-10 rounded-full shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                  style={{ backgroundColor: event.projectColor }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="size-12 text-blue-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 mb-1">No Activity</h3>
            <p className="text-sm text-gray-400">
              {selectedProject
                ? `No activity recorded for "${selectedProject.title || selectedProject.name}" yet.`
                : 'No activity has been recorded yet. Upload some media to see your timeline.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePage;
