import { useState, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { api } from '../services/api';
import {
  Edit3,
  Plus,
  RotateCcw,
  ChevronDown,
  Save,
  Bookmark,
} from 'lucide-react';

import StatsCardWidget from '../components/dashboard/StatsCardWidget';
import PieChartWidget from '../components/dashboard/PieChartWidget';
import BarChartWidget from '../components/dashboard/BarChartWidget';
import TopTagsWidget from '../components/dashboard/TopTagsWidget';
import MediaBreakdownWidget from '../components/dashboard/MediaBreakdownWidget';
import RecentActivityWidget from '../components/dashboard/RecentActivityWidget';
import MiniGraphWidget from '../components/dashboard/MiniGraphWidget';
import TagRelationshipWidget from '../components/dashboard/TagRelationshipWidget';
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget';
import RecentlyViewedWidget from '../components/dashboard/RecentlyViewedWidget';
import WidgetPalette from '../components/dashboard/WidgetPalette';

import {
  type WidgetConfig,
  type WidgetType,
  DASHBOARD_PRESETS,
  loadDashboardLayout,
  saveDashboardLayout,
  generateWidgetId,
  getRegistryEntry,
} from '../utils/dashboardDefaults';

type BreakpointKey = 'lg' | 'md' | 'sm';

const DashboardPage = () => {
  // ─── Data fetching ───────────────────────────────────────────
  const [media, setMedia] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaData, projectsData, tagsData, relsData] = await Promise.all([
          api.getItems(),
          api.getProjects(),
          api.getTags(),
          api.getTagRelationships(),
        ]);
        setMedia(mediaData);
        setProjects(projectsData);
        setTags(tagsData);
        setRelationships(relsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Computed stats ──────────────────────────────────────────
  const stats = useMemo(
    () => ({
      totalProjects: projects.length,
      totalMedia: media.length,
      totalTags: tags.length,
      totalConnections: media.reduce(
        (acc: number, m: any) => acc + (m.relatedMedia?.length || 0),
        0
      ),
      avgTagsPerMedia:
        media.length > 0
          ? (
              media.reduce((acc, m) => acc + (m.tagIds?.length || 0), 0) / media.length
            ).toFixed(1)
          : '0',
    }),
    [media, projects, tags]
  );

  // ─── Dashboard state ────────────────────────────────────────
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);

  // Container width for responsive grid
  const { width: containerWidth, containerRef, mounted } = useContainerWidth({
    initialWidth: 1200,
  });

  // Load saved or default layout
  useEffect(() => {
    const saved = loadDashboardLayout();
    if (saved) {
      setWidgets(saved.widgets);
      setActivePresetId(saved.presetId);
    } else {
      const defaultPreset = DASHBOARD_PRESETS.find((p) => p.id === 'overview');
      if (defaultPreset) {
        setWidgets(defaultPreset.widgets);
        setActivePresetId(defaultPreset.id);
      }
    }
  }, []);

  // ─── Layout actions ──────────────────────────────────────────
  const handleLayoutChange = useCallback(
    (layout: any[]) => {
      if (!isEditing) return;
      setWidgets((prev) =>
        prev.map((widget) => {
          const layoutItem = layout.find((l: any) => l.i === widget.i);
          if (layoutItem) {
            return {
              ...widget,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            };
          }
          return widget;
        })
      );
    },
    [isEditing]
  );

  const handleSave = () => {
    saveDashboardLayout({
      presetId: activePresetId,
      widgets,
      savedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleAddWidget = (type: WidgetType) => {
    const entry = getRegistryEntry(type);
    if (!entry) return;

    const newWidget: WidgetConfig = {
      i: generateWidgetId(type),
      type,
      x: 0,
      y: Infinity, // placed at the bottom
      w: entry.defaultW,
      h: entry.defaultH,
      minW: entry.minW,
      minH: entry.minH,
      maxW: entry.maxW,
      maxH: entry.maxH,
      settings: entry.defaultSettings ? { ...entry.defaultSettings } : undefined,
    };

    setWidgets((prev) => [...prev, newWidget]);
    setActivePresetId(null);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.i !== widgetId));
    setActivePresetId(null);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = DASHBOARD_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setWidgets(preset.widgets);
      setActivePresetId(presetId);
      setPresetMenuOpen(false);
      saveDashboardLayout({
        presetId: presetId,
        widgets: preset.widgets,
        savedAt: new Date().toISOString(),
      });
    }
  };

  const handleReset = () => {
    handleApplyPreset('overview');
    setIsEditing(false);
  };

  // ─── Active widget types (for palette) ──────────────────────
  const activeWidgetTypes = widgets.map((w) => w.type);

  // ─── Layout for react-grid-layout ───────────────────────────
  const gridLayouts = useMemo(() => {
    const lg = widgets.map((w) => ({
      i: w.i,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      minW: w.minW || getRegistryEntry(w.type)?.minW || 2,
      minH: w.minH || getRegistryEntry(w.type)?.minH || 2,
      maxW: w.maxW || getRegistryEntry(w.type)?.maxW || 12,
      maxH: w.maxH || getRegistryEntry(w.type)?.maxH || 8,
      static: !isEditing,
    }));
    return { lg, md: lg, sm: lg } as Record<BreakpointKey, typeof lg>;
  }, [widgets, isEditing]);

  // ─── Widget renderer ────────────────────────────────────────
  const renderWidget = (widget: WidgetConfig) => {
    const commonProps = {
      isEditing,
      onRemove: () => handleRemoveWidget(widget.i),
    };

    switch (widget.type) {
      case 'stats-card':
        return (
          <StatsCardWidget
            metric={widget.settings?.metric || 'totalProjects'}
            data={stats}
            {...commonProps}
          />
        );
      case 'pie-chart':
        return <PieChartWidget media={media} {...commonProps} />;
      case 'bar-chart':
        return <BarChartWidget media={media} projects={projects} {...commonProps} />;
      case 'top-tags':
        return (
          <TopTagsWidget
            media={media}
            count={widget.settings?.count || 10}
            {...commonProps}
          />
        );
      case 'media-breakdown':
        return <MediaBreakdownWidget media={media} {...commonProps} />;
      case 'recent-activity':
        return <RecentActivityWidget media={media} {...commonProps} />;
      case 'mini-graph':
        return <MiniGraphWidget media={media} projects={projects} {...commonProps} />;
      case 'tag-relationships':
        return (
          <TagRelationshipWidget
            tags={tags}
            relationships={relationships}
            {...commonProps}
          />
        );
      case 'quick-actions':
        return <QuickActionsWidget {...commonProps} />;
      case 'recently-viewed':
        return <RecentlyViewedWidget media={media} {...commonProps} />;
      default:
        return <div className="p-4 text-gray-400 text-sm">Unknown widget type</div>;
    }
  };

  // ─── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentPreset = DASHBOARD_PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-1">Dashboard</h1>
            <p className="text-gray-500 text-sm">
              {currentPreset
                ? `${currentPreset.name} layout`
                : 'Custom layout'}{' '}
              · {widgets.length} widgets
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Preset Switcher */}
            <div className="relative">
              <button
                onClick={() => setPresetMenuOpen(!presetMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-white text-sm text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Bookmark className="size-4" />
                {currentPreset?.name || 'Custom'}
                <ChevronDown className="size-3.5" />
              </button>

              {presetMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPresetMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-blue-100 py-1 w-56">
                    {DASHBOARD_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset.id)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors ${
                          activePresetId === preset.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium">{preset.name}</div>
                        <div className="text-[11px] text-gray-400">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Edit / Save buttons */}
            {isEditing ? (
              <>
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  <Plus className="size-4" />
                  Add Widget
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <Save className="size-4" />
                  Save Layout
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-colors text-sm"
              >
                <Edit3 className="size-4" />
                Customize
              </button>
            )}
          </div>
        </div>

        {/* Edit mode banner */}
        {isEditing && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm flex items-center gap-3 shadow-sm">
            <Edit3 className="size-4 shrink-0" />
            <span className="flex-1">
              <strong>Edit Mode</strong> — Drag widgets to rearrange, resize with handles, or
              remove with the × button. Click "Save Layout" when done.
            </span>
            <button
              onClick={handleSave}
              className="shrink-0 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium"
            >
              Done Editing
            </button>
          </div>
        )}

        {/* Widget Grid */}
        <div ref={containerRef}>
          {widgets.length > 0 && mounted ? (
            <ResponsiveGridLayout
              className="layout"
              width={containerWidth}
              layouts={gridLayouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768 }}
              cols={{ lg: 12, md: 12, sm: 6 }}
              rowHeight={60}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              resizeConfig={{ enabled: isEditing }}
              dragConfig={{
                enabled: isEditing,
                handle: '.drag-handle',
              }}
              onLayoutChange={(layout) => handleLayoutChange(layout as any[])}
            >
              {widgets.map((widget) => (
                <div key={widget.i}>{renderWidget(widget)}</div>
              ))}
            </ResponsiveGridLayout>
          ) : widgets.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No Widgets</h3>
              <p className="text-gray-500 text-sm mb-4">
                Your dashboard is empty. Add widgets or apply a preset to get started.
              </p>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setPaletteOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add Your First Widget
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Widget Palette Modal */}
      <WidgetPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAdd={handleAddWidget}
        activeWidgetTypes={activeWidgetTypes}
      />
    </div>
  );
};

export default DashboardPage;
