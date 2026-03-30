import { ReactNode } from 'react';
import { GripVertical, X, Settings } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  children: ReactNode;
  isEditing: boolean;
  onRemove?: () => void;
  onSettings?: () => void;
  className?: string;
}

const DashboardWidget = ({
  title,
  children,
  isEditing,
  onRemove,
  onSettings,
  className = '',
}: DashboardWidgetProps) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-blue-100 h-full flex flex-col overflow-hidden transition-shadow ${
        isEditing ? 'ring-2 ring-blue-200 ring-offset-1 shadow-md' : 'hover:shadow-md'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 flex-shrink-0">
        {isEditing && (
          <div className="drag-handle cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
            <GripVertical className="size-4" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-blue-900 flex-1 truncate">{title}</h3>
        {isEditing && (
          <div className="flex items-center gap-1">
            {onSettings && (
              <button
                onClick={onSettings}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Widget Settings"
              >
                <Settings className="size-3.5" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove Widget"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto min-h-0">{children}</div>
    </div>
  );
};

export default DashboardWidget;
