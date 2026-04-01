import { useState, useEffect, useMemo } from 'react';
import DashboardWidget from './DashboardWidget';
import { api } from '../../services/api';
import {
  Plus, Edit3, Trash2, Upload, Tag, FolderPlus, Link2,
  FileText, Image, Film, Music, FileCode, File
} from 'lucide-react';

interface RecentActivityWidgetProps {
  media: any[];
  isEditing: boolean;
  onRemove?: () => void;
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  create: { icon: Plus, color: 'bg-emerald-100 text-emerald-600', label: 'Created' },
  update: { icon: Edit3, color: 'bg-blue-100 text-blue-600', label: 'Updated' },
  delete: { icon: Trash2, color: 'bg-red-100 text-red-600', label: 'Deleted' },
};

const TARGET_ICON: Record<string, any> = {
  Item: FileText,
  Project: FolderPlus,
  Tag: Tag,
  TagRelationship: Link2,
};

const RecentActivityWidget = ({ media, isEditing, onRemove }: RecentActivityWidgetProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [hasAuditLogs, setHasAuditLogs] = useState(true);

  // Try to fetch real audit logs; fall back to media creation timestamps
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const result = await api.getAuditLogs({ limit: 15 });
        if (result.logs && result.logs.length > 0) {
          setLogs(result.logs);
          setHasAuditLogs(true);
        } else {
          setHasAuditLogs(false);
        }
      } catch {
        // API might not be available yet
        setHasAuditLogs(false);
      }
    };
    fetchLogs();
  }, []);

  // Fallback: derive activity from media creation timestamps
  const fallbackItems = useMemo(() => {
    return [...media]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12)
      .map(item => ({
        _id: item._id,
        actionType: 'create',
        targetType: 'Item',
        timestamp: item.createdAt,
        details: { title: item.title },
      }));
  }, [media]);

  const displayItems = hasAuditLogs ? logs : fallbackItems;

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardWidget title="Recent Activity" isEditing={isEditing} onRemove={onRemove}>
      <div className="space-y-1">
        {displayItems.length > 0 ? (
          displayItems.map((log: any, idx: number) => {
            const action = ACTION_CONFIG[log.actionType] || ACTION_CONFIG.create;
            const ActionIcon = action.icon;
            const TargetIcon = TARGET_ICON[log.targetType] || File;
            const title = log.details?.title || log.details?.name || log.targetType;

            return (
              <div
                key={log._id || idx}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-blue-50/50 transition-colors group"
              >
                <div className={`p-1.5 rounded-md shrink-0 ${action.color}`}>
                  <ActionIcon className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {action.label} <span className="text-gray-500">{title}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <TargetIcon className="size-3" />
                    {log.targetType}
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 shrink-0">
                  {formatTimeAgo(log.timestamp)}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No activity yet</p>
        )}
      </div>
    </DashboardWidget>
  );
};

export default RecentActivityWidget;
