import { useMemo } from 'react';
import DashboardWidget from './DashboardWidget';
import { getMediaCategory, getMediaIcon } from '../../utils/mediaUtils';

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

interface MediaBreakdownWidgetProps {
  media: any[];
  isEditing: boolean;
  onRemove?: () => void;
}

const MediaBreakdownWidget = ({ media, isEditing, onRemove }: MediaBreakdownWidgetProps) => {
  const breakdownData = useMemo(() => {
    const counts: Record<string, number> = {};
    media.forEach((item) => {
      const cat = getMediaCategory(item.metadata?.mimetype || item.mediaType);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([category, value]) => ({
      category,
      name: CATEGORY_LABELS[category] || category,
      value,
      color: CATEGORY_COLORS[category] || '#6B7280',
    }));
  }, [media]);

  return (
    <DashboardWidget title="Media Type Breakdown" isEditing={isEditing} onRemove={onRemove}>
      <div className="space-y-3.5">
        {breakdownData.length > 0 ? (
          breakdownData.map((type) => {
            const Icon = getMediaIcon(type.category);
            return (
              <div key={type.name} className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-lg shrink-0"
                  style={{ backgroundColor: type.color + '18' }}
                >
                  <Icon className="size-4" style={{ color: type.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{type.name}</span>
                    <span className="text-sm font-semibold text-blue-900">{type.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${media.length > 0 ? (type.value / media.length) * 100 : 0}%`,
                        backgroundColor: type.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No media yet</p>
        )}
      </div>
    </DashboardWidget>
  );
};

export default MediaBreakdownWidget;
