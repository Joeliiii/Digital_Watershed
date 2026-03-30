import { X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { WIDGET_REGISTRY, type WidgetType } from '../../utils/dashboardDefaults';

interface WidgetPaletteProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => void;
  activeWidgetTypes: WidgetType[];
}

const WidgetPalette = ({ open, onClose, onAdd, activeWidgetTypes }: WidgetPaletteProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-blue-100 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-blue-900">Add Widget</h2>
            <p className="text-sm text-gray-500">Choose a widget to add to your dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WIDGET_REGISTRY.map((entry) => {
              const IconComponent = (Icons as any)[entry.icon] || Icons.Box;
              const alreadyActive = activeWidgetTypes.includes(entry.type);

              return (
                <button
                  key={entry.type}
                  onClick={() => {
                    onAdd(entry.type);
                    onClose();
                  }}
                  className={`group text-left p-4 rounded-xl border transition-all ${
                    alreadyActive
                      ? 'border-gray-100 bg-gray-50'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        alreadyActive
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                      }`}
                    >
                      <IconComponent className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-semibold ${
                            alreadyActive ? 'text-gray-400' : 'text-blue-900'
                          }`}
                        >
                          {entry.label}
                        </h3>
                        {alreadyActive && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                            Active
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${
                          alreadyActive ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {entry.description}
                      </p>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Default size: {entry.defaultW}×{entry.defaultH}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetPalette;
