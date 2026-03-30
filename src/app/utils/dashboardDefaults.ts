// Dashboard configuration: widget registry, presets, and persistence helpers

export type WidgetType =
  | 'stats-card'
  | 'pie-chart'
  | 'bar-chart'
  | 'top-tags'
  | 'media-breakdown'
  | 'recent-activity'
  | 'mini-graph'
  | 'tag-relationships'
  | 'quick-actions';

export interface WidgetConfig {
  /** Unique instance id (e.g. "stats-card-1") */
  i: string;
  type: WidgetType;
  /** Grid position / size — consumed by react-grid-layout */
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  /** Widget-specific settings (e.g. which metric for stats-card) */
  settings?: Record<string, any>;
}

export interface WidgetRegistryEntry {
  type: WidgetType;
  label: string;
  description: string;
  icon: string; // lucide icon name
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
  /** Default settings object */
  defaultSettings?: Record<string, any>;
}

export const WIDGET_REGISTRY: WidgetRegistryEntry[] = [
  {
    type: 'stats-card',
    label: 'Stats Card',
    description: 'Single metric display (projects, media, tags, connections)',
    icon: 'Hash',
    defaultW: 3,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 2,
    defaultSettings: { metric: 'totalProjects' },
  },
  {
    type: 'pie-chart',
    label: 'Media Distribution',
    description: 'Pie chart of media types',
    icon: 'PieChart',
    defaultW: 6,
    defaultH: 5,
    minW: 4,
    minH: 4,
    maxW: 8,
    maxH: 6,
  },
  {
    type: 'bar-chart',
    label: 'Media by Project',
    description: 'Bar chart of items per project',
    icon: 'BarChart3',
    defaultW: 6,
    defaultH: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 6,
  },
  {
    type: 'top-tags',
    label: 'Top Tags',
    description: 'Ranked list of most-used tags',
    icon: 'Tags',
    defaultW: 6,
    defaultH: 5,
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 8,
    defaultSettings: { count: 10 },
  },
  {
    type: 'media-breakdown',
    label: 'Type Breakdown',
    description: 'Progress-bar breakdown by media category',
    icon: 'Layers',
    defaultW: 6,
    defaultH: 5,
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 8,
  },
  {
    type: 'recent-activity',
    label: 'Recent Activity',
    description: 'Timeline of recently created items',
    icon: 'Clock',
    defaultW: 6,
    defaultH: 5,
    minW: 4,
    minH: 3,
    maxW: 12,
    maxH: 8,
  },
  {
    type: 'mini-graph',
    label: 'Network Preview',
    description: 'Embedded mini force-graph of your data',
    icon: 'Network',
    defaultW: 6,
    defaultH: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    type: 'tag-relationships',
    label: 'Tag Relationships',
    description: 'Mini graph of tag-to-tag connections',
    icon: 'Link2',
    defaultW: 6,
    defaultH: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
  },
  {
    type: 'quick-actions',
    label: 'Quick Actions',
    description: 'Shortcut buttons for common tasks',
    icon: 'Zap',
    defaultW: 3,
    defaultH: 4,
    minW: 2,
    minH: 3,
    maxW: 6,
    maxH: 5,
  },
];

// ─── Preset Layouts ──────────────────────────────────────────

export interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  widgets: WidgetConfig[];
}

export const DASHBOARD_PRESETS: DashboardPreset[] = [
  {
    id: 'overview',
    name: 'Overview',
    description: 'All basic stats, charts, and quick actions',
    widgets: [
      { i: 'stats-projects', type: 'stats-card', x: 0, y: 0, w: 3, h: 2, settings: { metric: 'totalProjects' } },
      { i: 'stats-media', type: 'stats-card', x: 3, y: 0, w: 3, h: 2, settings: { metric: 'totalMedia' } },
      { i: 'stats-tags', type: 'stats-card', x: 6, y: 0, w: 3, h: 2, settings: { metric: 'totalTags' } },
      { i: 'stats-connections', type: 'stats-card', x: 9, y: 0, w: 3, h: 2, settings: { metric: 'totalConnections' } },
      { i: 'pie-1', type: 'pie-chart', x: 0, y: 2, w: 6, h: 5 },
      { i: 'bar-1', type: 'bar-chart', x: 6, y: 2, w: 6, h: 5 },
      { i: 'tags-1', type: 'top-tags', x: 0, y: 7, w: 6, h: 5, settings: { count: 10 } },
      { i: 'breakdown-1', type: 'media-breakdown', x: 6, y: 7, w: 6, h: 5 },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics Focus',
    description: 'Larger charts and deeper data views',
    widgets: [
      { i: 'stats-projects', type: 'stats-card', x: 0, y: 0, w: 3, h: 2, settings: { metric: 'totalProjects' } },
      { i: 'stats-media', type: 'stats-card', x: 3, y: 0, w: 3, h: 2, settings: { metric: 'totalMedia' } },
      { i: 'stats-tags', type: 'stats-card', x: 6, y: 0, w: 3, h: 2, settings: { metric: 'totalTags' } },
      { i: 'stats-avg', type: 'stats-card', x: 9, y: 0, w: 3, h: 2, settings: { metric: 'avgTagsPerMedia' } },
      { i: 'pie-1', type: 'pie-chart', x: 0, y: 2, w: 6, h: 5 },
      { i: 'bar-1', type: 'bar-chart', x: 6, y: 2, w: 6, h: 5 },
      { i: 'tags-1', type: 'top-tags', x: 0, y: 7, w: 4, h: 5, settings: { count: 15 } },
      { i: 'breakdown-1', type: 'media-breakdown', x: 4, y: 7, w: 4, h: 5 },
      { i: 'activity-1', type: 'recent-activity', x: 8, y: 7, w: 4, h: 5 },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Just stats and quick actions',
    widgets: [
      { i: 'stats-projects', type: 'stats-card', x: 0, y: 0, w: 3, h: 2, settings: { metric: 'totalProjects' } },
      { i: 'stats-media', type: 'stats-card', x: 3, y: 0, w: 3, h: 2, settings: { metric: 'totalMedia' } },
      { i: 'stats-tags', type: 'stats-card', x: 6, y: 0, w: 3, h: 2, settings: { metric: 'totalTags' } },
      { i: 'stats-connections', type: 'stats-card', x: 9, y: 0, w: 3, h: 2, settings: { metric: 'totalConnections' } },
      { i: 'quick-1', type: 'quick-actions', x: 0, y: 2, w: 4, h: 4 },
      { i: 'activity-1', type: 'recent-activity', x: 4, y: 2, w: 8, h: 4 },
    ],
  },
];

// ─── LocalStorage Persistence ────────────────────────────────

const STORAGE_KEY = 'dw-dashboard-layout';

export interface SavedDashboard {
  presetId: string | null;
  widgets: WidgetConfig[];
  savedAt: string;
}

export function loadDashboardLayout(): SavedDashboard | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedDashboard;
  } catch {
    return null;
  }
}

export function saveDashboardLayout(data: SavedDashboard): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearDashboardLayout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Helpers ─────────────────────────────────────────────────

let _counter = 0;
export function generateWidgetId(type: WidgetType): string {
  _counter++;
  return `${type}-${Date.now()}-${_counter}`;
}

export function getRegistryEntry(type: WidgetType): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY.find(w => w.type === type);
}
