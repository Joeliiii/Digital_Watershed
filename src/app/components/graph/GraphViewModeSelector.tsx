import { Atom, CircleDot, Group } from 'lucide-react';

export type LayoutMode = 'force' | 'radial' | 'cluster';

interface GraphViewModeSelectorProps {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  viewMode: 'media' | 'tags' | 'combined';
  setViewMode: (mode: 'media' | 'tags' | 'combined') => void;
}

const layoutModes: { id: LayoutMode; label: string; icon: any; description: string }[] = [
  { id: 'force', label: 'Force', icon: Atom, description: 'Physics-based layout' },
  { id: 'radial', label: 'Radial', icon: CircleDot, description: 'Rings around selected node' },
  { id: 'cluster', label: 'Cluster', icon: Group, description: 'Group by project' },
];

const dataViewModes = [
  { id: 'combined' as const, label: 'All', description: 'Media + Tags' },
  { id: 'media' as const, label: 'Media', description: 'Items only' },
  { id: 'tags' as const, label: 'Tags', description: 'Tag network' },
];

const GraphViewModeSelector = ({
  layoutMode,
  setLayoutMode,
  viewMode,
  setViewMode,
}: GraphViewModeSelectorProps) => {
  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
      {/* Layout Mode */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-1 flex gap-0.5">
        {layoutModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setLayoutMode(mode.id)}
              title={mode.description}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                layoutMode === mode.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <Icon className="size-3.5" />
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Data View Mode */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-1 flex gap-0.5">
        {dataViewModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            title={mode.description}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === mode.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GraphViewModeSelector;
