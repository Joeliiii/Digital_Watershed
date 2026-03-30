import { useMemo } from 'react';
import DashboardWidget from './DashboardWidget';
import { getMediaIcon, getTypeColor, getMediaLabel } from '../../utils/mediaUtils';

interface RecentActivityWidgetProps {
  media: any[];
  isEditing: boolean;
  onRemove?: () => void;
}

const RecentActivityWidget = ({ media, isEditing, onRemove }: RecentActivityWidgetProps) => {
  const recentItems = useMemo(() => {
    return [...media]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
  }, [media]);

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
    <DashboardWidget title="Recent Activity" isEditing={isEditing} onRemove={onRemove}>
      <div className="space-y-1">
        {recentItems.length > 0 ? (
          recentItems.map((item) => {
            const mimeType = item.metadata?.mimetype || item.mediaType;
            const Icon = getMediaIcon(mimeType);
            return (
              <div
                key={item._id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-blue-50/50 transition-colors group"
              >
                <div className={`p-1.5 rounded-md shrink-0 ${getTypeColor(mimeType)}`}>
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
                  <div className="text-[11px] text-gray-400">{getMediaLabel(mimeType)}</div>
                </div>
                <div className="text-[11px] text-gray-400 shrink-0">
                  {formatTimeAgo(item.createdAt)}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No activity yet</p>
        )}
      </div>
    </DashboardWidget>
  );
};

export default RecentActivityWidget;
