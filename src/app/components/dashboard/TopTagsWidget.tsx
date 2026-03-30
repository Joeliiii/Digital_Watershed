import { useMemo } from 'react';
import DashboardWidget from './DashboardWidget';

interface TopTagsWidgetProps {
  media: any[];
  count?: number;
  isEditing: boolean;
  onRemove?: () => void;
}

const TopTagsWidget = ({ media, count = 10, isEditing, onRemove }: TopTagsWidgetProps) => {
  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    media.forEach((item) => {
      item.tagIds?.forEach((tag: any) => {
        const name = typeof tag === 'string' ? tag : tag.name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([tag, cnt]) => ({ tag, count: cnt }));
  }, [media, count]);

  const maxCount = topTags.length > 0 ? Math.max(...topTags.map((t) => t.count)) : 1;

  return (
    <DashboardWidget title={`Top ${count} Tags`} isEditing={isEditing} onRemove={onRemove}>
      <div className="space-y-2.5">
        {topTags.length > 0 ? (
          topTags.map((item, index) => (
            <div key={item.tag} className="flex items-center gap-3">
              <div className="text-xs font-bold text-blue-400 w-5 text-right">{index + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 truncate">{item.tag}</span>
                  <span className="text-xs font-semibold text-blue-900 ml-2">{item.count}</span>
                </div>
                <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No tags in use yet</p>
        )}
      </div>
    </DashboardWidget>
  );
};

export default TopTagsWidget;
