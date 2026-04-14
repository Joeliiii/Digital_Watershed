import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface GraphSearchBarProps {
  nodes: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectNode: (nodeId: string) => void;
  onClear: () => void;
}

const GraphSearchBar = ({
  nodes,
  searchQuery,
  setSearchQuery,
  onSelectNode,
  onClear,
}: GraphSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes
      .filter((n) => n.name?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [nodes, searchQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [matches]);

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && matches[selectedIndex]) {
      e.preventDefault();
      handleSelect(matches[selectedIndex].id);
    } else if (e.key === 'Escape') {
      onClear();
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-72">
      <div
        className={`relative flex items-center bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border transition-all ${
          isFocused ? 'border-blue-400 ring-2 ring-blue-100' : 'border-blue-200'
        }`}
      >
        <Search className="size-4 text-gray-400 ml-3 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          className="w-full px-2.5 py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            className="mr-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="size-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isFocused && matches.length > 0 && (
        <div
          ref={dropdownRef}
          className="mt-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-blue-100 overflow-hidden max-h-64 overflow-y-auto"
        >
          {matches.map((node, i) => (
            <button
              key={node.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(node.id);
              }}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                i === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-3 h-3 shrink-0 ${
                  node.nodeType === 'tag' ? 'rotate-45 rounded-sm' : 'rounded-full'
                }`}
                style={{ backgroundColor: node.color || '#3B82F6' }}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{node.name}</div>
                <div className="text-[10px] text-gray-400 uppercase">{node.nodeType || 'media'}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isFocused && searchQuery && matches.length === 0 && (
        <div className="mt-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-blue-100 px-4 py-3">
          <p className="text-sm text-gray-400 text-center">No nodes found</p>
        </div>
      )}
    </div>
  );
};

export default GraphSearchBar;
