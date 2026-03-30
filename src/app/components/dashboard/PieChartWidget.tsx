import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardWidget from './DashboardWidget';
import { getMediaCategory } from '../../utils/mediaUtils';

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

interface PieChartWidgetProps {
  media: any[];
  isEditing: boolean;
  onRemove?: () => void;
}

const PieChartWidget = ({ media, isEditing, onRemove }: PieChartWidgetProps) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    media.forEach((item) => {
      const cat = getMediaCategory(item.metadata?.mimetype || item.mediaType);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([category, value]) => ({
      name: CATEGORY_LABELS[category] || category,
      value,
      color: CATEGORY_COLORS[category] || '#6B7280',
    }));
  }, [media]);

  return (
    <DashboardWidget title="Media Distribution" isEditing={isEditing} onRemove={onRemove}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} (${value})`}
              outerRadius="70%"
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value: string) => (
                <span style={{ color: '#374151' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          No media yet
        </div>
      )}
    </DashboardWidget>
  );
};

export default PieChartWidget;
