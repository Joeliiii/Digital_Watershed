import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardWidget from './DashboardWidget';
import { Clock, Eye, ExternalLink } from 'lucide-react';
import { getViewHistory, type ViewHistoryEntry } from '../../utils/viewHistory';

interface RecentlyViewedWidgetProps {
  media: any[];
  isEditing: boolean;
  onRemove?: () => void;
}

const RecentlyViewedWidget = ({ media, isEditing, onRemove }: RecentlyViewedWidgetProps) => {
  const navigate = useNavigate();
  const [viewHistory, setViewHistory] = useState<ViewHistoryEntry[]>([]);

  // Load view history from localStorage on mount and periodically refresh
  const refresh = useCallback(() => {
    setViewHistory(getViewHistory());
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 2 seconds so the widget updates when user returns from a detail page
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  const recentItems = useMemo(() => {
    return viewHistory.slice(0, 8).map(history => {
      const mediaItem = media.find(m => m._id === history.mediaId);
      if (!mediaItem) return null;
      return { ...mediaItem, viewedAt: history.viewedAt, viewCount: history.viewCount };
    }).filter(Boolean);
  }, [viewHistory, media]);

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardWidget title="Recently Viewed" isEditing={isEditing} onRemove={onRemove}>
      <div className="space-y-1">
        {recentItems.length > 0 ? (
          recentItems.map((item: any) => (
            <button
              key={item._id}
              onClick={() => !isEditing && navigate(`/media/${item._id}`)}
              className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-blue-50/50 transition-colors group text-left"
            >
              <div className="p-1.5 rounded-md bg-purple-100 text-purple-600 shrink-0">
                <Clock className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
                <div className="text-[11px] text-gray-400 flex items-center gap-2">
                  <span className="flex items-center gap-1"><Eye className="size-3" />{item.viewCount}</span>
                  <span>{formatTimeAgo(item.viewedAt)}</span>
                </div>
              </div>
              <ExternalLink className="size-3.5 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
            </button>
          ))
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No recently viewed items</p>
        )}
      </div>
    </DashboardWidget>
  );
};

export default RecentlyViewedWidget;
