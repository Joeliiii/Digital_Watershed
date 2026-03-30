import { FolderPlus, Database, Tags, Network, TrendingUp } from 'lucide-react';
import DashboardWidget from './DashboardWidget';

type MetricKey = 'totalProjects' | 'totalMedia' | 'totalTags' | 'totalConnections' | 'avgTagsPerMedia';

interface StatsCardWidgetProps {
  metric: MetricKey;
  data: {
    totalProjects: number;
    totalMedia: number;
    totalTags: number;
    totalConnections: number;
    avgTagsPerMedia: string;
  };
  isEditing: boolean;
  onRemove?: () => void;
}

const METRIC_CONFIG: Record<MetricKey, { label: string; icon: any; colorClass: string }> = {
  totalProjects: { label: 'Total Projects', icon: FolderPlus, colorClass: 'bg-blue-100 text-blue-600' },
  totalMedia: { label: 'Media Items', icon: Database, colorClass: 'bg-violet-100 text-violet-600' },
  totalTags: { label: 'Total Tags', icon: Tags, colorClass: 'bg-emerald-100 text-emerald-600' },
  totalConnections: { label: 'Connections', icon: Network, colorClass: 'bg-amber-100 text-amber-600' },
  avgTagsPerMedia: { label: 'Avg Tags / Media', icon: TrendingUp, colorClass: 'bg-rose-100 text-rose-600' },
};

const StatsCardWidget = ({ metric, data, isEditing, onRemove }: StatsCardWidgetProps) => {
  const config = METRIC_CONFIG[metric] || METRIC_CONFIG.totalProjects;
  const Icon = config.icon;
  const value = data[metric];

  return (
    <DashboardWidget title={config.label} isEditing={isEditing} onRemove={onRemove}>
      <div className="flex items-center justify-between h-full">
        <div>
          <div className="text-3xl font-bold text-blue-900">{value}</div>
          <div className="text-xs text-gray-500 mt-1">{config.label}</div>
        </div>
        <div className={`p-3 rounded-xl ${config.colorClass}`}>
          <Icon className="size-6" />
        </div>
      </div>
    </DashboardWidget>
  );
};

export default StatsCardWidget;
