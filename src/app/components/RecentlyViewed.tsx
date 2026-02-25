import { useState, useEffect, useMemo } from 'react';
import { Clock, Eye, Trash2, ExternalLink, Filter, Calendar } from 'lucide-react';
import { useWatershed } from '../context/WatershedContext';


interface ViewHistory {
  mediaId: string;
  viewedAt: string;
  viewCount: number;
}

const RecentlyViewed = () => {
  const { media, projects, tags } = useWatershed();
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'frequent'>('recent');

  // Load view history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('watershed_view_history');
    if (stored) {
      setViewHistory(JSON.parse(stored));
    }
  }, []);

  // Save view history to localStorage
  useEffect(() => {
    if (viewHistory.length > 0) {
      localStorage.setItem('watershed_view_history', JSON.stringify(viewHistory));
    }
  }, [viewHistory]);

  // Record a view 
  const recordView = (mediaId: string) => {
    setViewHistory(prev => {
      const existing = prev.find(h => h.mediaId === mediaId);
      
      if (existing) {
        // Update existing entry
        return prev.map(h =>
          h.mediaId === mediaId
            ? { ...h, viewedAt: new Date().toISOString(), viewCount: h.viewCount + 1 }
            : h
        );
      } else {
        // Add new entry
        return [
          ...prev,
          {
            mediaId,
            viewedAt: new Date().toISOString(),
            viewCount: 1
          }
        ];
      }
    });
  };

  // Make recordView available globally (for other components to use)
  useEffect(() => {
    (window as any).recordMediaView = recordView;
  }, []);

  // Filter by time range
  const filteredByTime = useMemo(() => {
    const now = new Date();
    
    return viewHistory.filter(entry => {
      const viewDate = new Date(entry.viewedAt);
      
      switch (timeFilter) {
        case 'today':
          return viewDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return viewDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return viewDate >= monthAgo;
        default:
          return true;
      }
    });
  }, [viewHistory, timeFilter]);

  // Sort entries
  const sortedHistory = useMemo(() => {
    const sorted = [...filteredByTime];
    
    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
    } else {
      sorted.sort((a, b) => b.viewCount - a.viewCount);
    }
    
    return sorted;
  }, [filteredByTime, sortBy]);

  // Get media items with history data
  const mediaWithHistory = useMemo(() => {
    return sortedHistory.map(history => {
      const mediaItem = media.find(m => m.id === history.mediaId);
      if (!mediaItem) return null;
      
      return {
        ...mediaItem,
        viewedAt: history.viewedAt,
        viewCount: history.viewCount
      };
    }).filter(Boolean);
  }, [sortedHistory, media]);

  // Remove a single item from history
  const removeFromHistory = (mediaId: string) => {
    if (window.confirm('Remove this item from your viewing history?')) {
      setViewHistory(prev => prev.filter(h => h.mediaId !== mediaId));
    }
  };

  // Clear all history
  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire viewing history? This action cannot be undone.')) {
      setViewHistory([]);
      localStorage.removeItem('watershed_view_history');
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  
  const typeConfig = {
    document: { icon: '📄', color: 'bg-orange-100 text-orange-600' },
    image: { icon: '🖼️', color: 'bg-blue-100 text-blue-600' },
    video: { icon: '🎥', color: 'bg-purple-100 text-purple-600' },
    audio: { icon: '🎵', color: 'bg-green-100 text-green-600' },
    code: { icon: '💻', color: 'bg-gray-100 text-gray-600' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                Recently Viewed
              </h1>
              <p className="text-slate-600">
                Track your recently accessed media items
              </p>
            </div>
            {viewHistory.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all"
              >
                <Trash2 className="size-4" />
                <span className="font-medium">Clear History</span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="size-5 text-purple-600" />
                <span className="text-sm font-medium text-slate-600">Total Views</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {viewHistory.reduce((acc, h) => acc + h.viewCount, 0)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="size-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-600">Unique Items</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {viewHistory.length}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="size-5 text-green-600" />
                <span className="text-sm font-medium text-slate-600">Most Viewed</span>
              </div>
              <div className="text-lg font-bold text-slate-900 truncate">
                {viewHistory.length > 0
                  ? media.find(m => m.id === [...viewHistory].sort((a, b) => b.viewCount - a.viewCount)[0]?.mediaId)?.title || 'N/A'
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Time Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Time:</span>
              <div className="flex gap-2">
                {(['all', 'today', 'week', 'month'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timeFilter === filter
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Sort:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('recent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === 'recent'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Most Recent
                </button>
                <button
                  onClick={() => setSortBy('frequent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === 'frequent'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Most Frequent
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Media List */}
        <div className="space-y-4">
          {mediaWithHistory.map(item => {
            if (!item) return null;
            
            const project = projects.find(p => p.id === item.projectId);
            const config = typeConfig[item.type];

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${config.color}`}>
                        {item.type}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      {project && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-xs text-slate-500">{project.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="size-3.5" />
                        {getRelativeTime(item.viewedAt)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Eye className="size-3.5" />
                        {item.viewCount} view{item.viewCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.tags.map(tagName => {
                          const tag = tags.find(t => t.name === tagName);
                          return (
                            <div
                              key={tagName}
                              className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700"
                              style={{ 
                                backgroundColor: tag ? `${tag.color}20` : undefined,
                                color: tag?.color
                              }}
                            >
                              {tagName}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => recordView(item.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all text-sm font-medium"
                      >
                        <ExternalLink className="size-4" />
                        View Again
                      </button>
                      <button
                        onClick={() => removeFromHistory(item.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-sm"
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {mediaWithHistory.length === 0 && (
          <div className="text-center py-16">
            <Clock className="size-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {timeFilter === 'all' ? 'No viewing history yet' : 'No items viewed in this time period'}
            </h3>
            <p className="text-slate-600 mb-6">
              {timeFilter === 'all' 
                ? 'Start viewing media items to see them here'
                : 'Try selecting a different time range'}
            </p>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 How to Track Views</h3>
          <p className="text-sm text-blue-800 mb-3">
            To automatically track when users view media items, call this function from your media detail pages:
          </p>
          <pre className="bg-white rounded p-3 text-xs text-slate-700 overflow-x-auto">
          </pre>
        </div>
      </div>
    </div>
  );
};

export default RecentlyViewed;