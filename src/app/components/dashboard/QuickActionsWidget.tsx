import { Link } from 'react-router-dom';
import { FolderPlus, Upload, Network, Tags } from 'lucide-react';
import DashboardWidget from './DashboardWidget';

interface QuickActionsWidgetProps {
  isEditing: boolean;
  onRemove?: () => void;
}

const actions = [
  {
    label: 'New Project',
    description: 'Create a project',
    link: '/create-project',
    icon: FolderPlus,
    colorClass: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
  },
  {
    label: 'Upload Media',
    description: 'Add files',
    link: '/media/create',
    icon: Upload,
    colorClass: 'bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
  },
  {
    label: 'Network',
    description: 'Explore graph',
    link: '/network',
    icon: Network,
    colorClass: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
  },
  {
    label: 'Tagging',
    description: 'Manage tags',
    link: '/tagging',
    icon: Tags,
    colorClass: 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
  },
];

const QuickActionsWidget = ({ isEditing, onRemove }: QuickActionsWidgetProps) => {
  return (
    <DashboardWidget title="Quick Actions" isEditing={isEditing} onRemove={onRemove}>
      <div className="grid grid-cols-2 gap-2 h-full">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={isEditing ? '#' : action.link}
              onClick={(e) => isEditing && e.preventDefault()}
              className="group flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all text-center"
            >
              <div className={`p-2 rounded-lg transition-colors mb-2 ${action.colorClass}`}>
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
              <span className="text-[10px] text-gray-400">{action.description}</span>
            </Link>
          );
        })}
      </div>
    </DashboardWidget>
  );
};

export default QuickActionsWidget;
