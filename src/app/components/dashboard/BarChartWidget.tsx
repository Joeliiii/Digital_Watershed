import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardWidget from './DashboardWidget';

interface BarChartWidgetProps {
  media: any[];
  projects: any[];
  isEditing: boolean;
  onRemove?: () => void;
}

const BarChartWidget = ({ media, projects, isEditing, onRemove }: BarChartWidgetProps) => {
  const chartData = useMemo(() => {
    return projects.map((project) => ({
      name:
        (project.title || project.name || '').length > 18
          ? (project.title || project.name || '').substring(0, 18) + '…'
          : project.title || project.name || '',
      count: media.filter((m) =>
        m.projectIds?.some(
          (p: any) => (typeof p === 'string' ? p : p._id) === project._id
        )
      ).length,
      fill: project.color || '#3B82F6',
    }));
  }, [projects, media]);

  return (
    <DashboardWidget title="Media by Project" isEditing={isEditing} onRemove={onRemove}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              axisLine={{ stroke: '#E5E7EB' }}
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
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          No projects yet
        </div>
      )}
    </DashboardWidget>
  );
};

export default BarChartWidget;
