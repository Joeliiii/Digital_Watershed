import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MapPin, MapPinOff, Focus, Navigation } from 'lucide-react';

interface GraphContextMenuProps {
  contextMenu: { x: number; y: number; node: any } | null;
  onClose: () => void;
  isNodePinned: (nodeId: string) => boolean;
  onTogglePin: (node: any) => void;
  onFocusNeighborhood: (node: any) => void;
}

const GraphContextMenu = ({
  contextMenu,
  onClose,
  isNodePinned,
  onTogglePin,
  onFocusNeighborhood,
}: GraphContextMenuProps) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu, onClose]);

  if (!contextMenu) return null;

  const { x, y, node } = contextMenu;
  const pinned = isNodePinned(node.id);
  const isMedia = node.nodeType !== 'tag';

  const menuItems = [
    ...(isMedia
      ? [
          {
            icon: Navigation,
            label: 'Navigate to Detail',
            action: () => {
              navigate(`/media/${node.id}`);
              onClose();
            },
          },
          {
            icon: ExternalLink,
            label: 'Open in New Tab',
            action: () => {
              window.open(`/media/${node.id}`, '_blank');
              onClose();
            },
          },
        ]
      : []),
    {
      icon: pinned ? MapPinOff : MapPin,
      label: pinned ? 'Unpin Node' : 'Pin Node',
      action: () => {
        onTogglePin(node);
        onClose();
      },
    },
    {
      icon: Focus,
      label: 'Focus Neighborhood',
      action: () => {
        onFocusNeighborhood(node);
        onClose();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-100 py-1.5 min-w-[180px] animate-in fade-in"
      style={{
        left: Math.min(x, window.innerWidth - 200),
        top: Math.min(y, window.innerHeight - menuItems.length * 44 - 20),
      }}
    >
      {/* Node Header */}
      <div className="px-3.5 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 shrink-0 ${
              node.nodeType === 'tag' ? 'rotate-45 rounded-sm' : 'rounded-full'
            }`}
            style={{ backgroundColor: node.color || '#3B82F6' }}
          />
          <span className="text-sm font-semibold text-gray-800 truncate">{node.name}</span>
        </div>
      </div>

      {/* Menu Items */}
      {menuItems.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={item.action}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default GraphContextMenu;
