import { useState } from 'react';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Circle,
  Diamond,
  FileText,
  Image,
  Video,
  Music,
  Code,
  File,
} from 'lucide-react';
import type { FilterState } from '../../hooks/useGraphInteractions';

interface GraphFilterPanelProps {
  filterState: FilterState;
  projects: any[];
  toggleEdgeType: (type: string) => void;
  toggleNodeType: (type: string) => void;
  toggleProject: (projectId: string) => void;
  toggleMediaType: (type: string) => void;
}

const edgeTypeLabels: Record<string, { label: string; color: string }> = {
  'shared-tag': { label: 'Shared Tags', color: '#93C5FD' },
  'media-tag': { label: 'Media ↔ Tag', color: '#E2E8F0' },
  related: { label: 'Related', color: '#3B82F6' },
  parent: { label: 'Parent → Child', color: '#8B5CF6' },
  depends_on: { label: 'Depends On', color: '#F59E0B' },
  derived_from: { label: 'Derived From', color: '#10B981' },
  contradicts: { label: 'Contradicts', color: '#EF4444' },
};

const mediaTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  document: { label: 'Documents', icon: FileText, color: '#3B82F6' },
  image: { label: 'Images', icon: Image, color: '#8B5CF6' },
  video: { label: 'Videos', icon: Video, color: '#EF4444' },
  audio: { label: 'Audio', icon: Music, color: '#F59E0B' },
  code: { label: 'Code', icon: Code, color: '#10B981' },
  other: { label: 'Other', icon: File, color: '#6B7280' },
};

const GraphFilterPanel = ({
  filterState,
  projects,
  toggleEdgeType,
  toggleNodeType,
  toggleProject,
  toggleMediaType,
}: GraphFilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-blue-200 hover:bg-blue-50 transition-all text-sm font-medium text-blue-700"
      >
        <Filter className="size-4" />
        Filters
        {isOpen ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>

      {/* Panel */}
      <div
        className={`absolute top-0 left-0 z-20 h-full bg-white/95 backdrop-blur-md border-r border-blue-100 shadow-xl transition-all duration-300 overflow-y-auto ${
          isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="pt-14 px-4 pb-4 space-y-5 min-w-[256px]">
          {/* Node Types */}
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Node Types</h4>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={filterState.nodeTypes.media}
                  onChange={() => toggleNodeType('media')}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Circle className="size-3.5 text-blue-500" />
                <span className="text-sm text-gray-700 group-hover:text-blue-700">Media Items</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={filterState.nodeTypes.tag}
                  onChange={() => toggleNodeType('tag')}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Diamond className="size-3.5 text-purple-500" />
                <span className="text-sm text-gray-700 group-hover:text-blue-700">Tags</span>
              </label>
            </div>
          </section>

          {/* Media Types */}
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Media Types</h4>
            <div className="space-y-1">
              {Object.entries(mediaTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <label
                    key={type}
                    className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filterState.mediaTypes[type] ?? true}
                      onChange={() => toggleMediaType(type)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Icon className="size-3.5" style={{ color: config.color }} />
                    <span className="text-sm text-gray-700 group-hover:text-blue-700">{config.label}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Projects */}
          {projects.length > 0 && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Projects</h4>
              <div className="space-y-1">
                {projects.map((project: any) => (
                  <label
                    key={project._id}
                    className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filterState.projects[project._id] ?? true}
                      onChange={() => toggleProject(project._id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: project.color || '#3B82F6' }}
                    />
                    <span className="text-sm text-gray-700 group-hover:text-blue-700 truncate">
                      {project.title || project.name}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Edge Types */}
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Connection Types</h4>
            <div className="space-y-1">
              {Object.entries(edgeTypeLabels).map(([type, config]) => (
                <label
                  key={type}
                  className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filterState.edgeTypes[type] ?? true}
                    onChange={() => toggleEdgeType(type)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-sm text-gray-700 group-hover:text-blue-700">{config.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default GraphFilterPanel;
