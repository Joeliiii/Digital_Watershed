import { useState, useCallback, useEffect, useMemo } from 'react';

const PINNED_STORAGE_KEY = 'dw-graph-pinned-nodes';

export interface FilterState {
  edgeTypes: Record<string, boolean>;
  nodeTypes: Record<string, boolean>;
  projects: Record<string, boolean>;
  mediaTypes: Record<string, boolean>;
}

export interface ContextMenuState {
  x: number;
  y: number;
  node: any;
}

interface PinnedPosition {
  fx: number;
  fy: number;
}

const defaultEdgeTypes: Record<string, boolean> = {
  'shared-tag': true,
  'media-tag': true,
  related: true,
  parent: true,
  depends_on: true,
  derived_from: true,
  contradicts: true,
};

const defaultNodeTypes: Record<string, boolean> = {
  media: true,
  tag: true,
};

const defaultMediaTypes: Record<string, boolean> = {
  document: true,
  image: true,
  video: true,
  audio: true,
  code: true,
  other: true,
};

function loadPinnedNodes(): Record<string, PinnedPosition> {
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePinnedNodes(pinned: Record<string, PinnedPosition>) {
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinned));
  } catch {
    // silently fail
  }
}

export function useGraphInteractions(graphData: { nodes: any[]; links: any[] }) {
  // Highlight state
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<any>>(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);

  // Pinned nodes — persisted in localStorage
  const [pinnedNodes, setPinnedNodes] = useState<Record<string, PinnedPosition>>(loadPinnedNodes);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Filters
  const [filterState, setFilterState] = useState<FilterState>({
    edgeTypes: { ...defaultEdgeTypes },
    nodeTypes: { ...defaultNodeTypes },
    projects: {},
    mediaTypes: { ...defaultMediaTypes },
  });

  // Persist pinned nodes
  useEffect(() => {
    savePinnedNodes(pinnedNodes);
  }, [pinnedNodes]);

  // Build adjacency map for neighbor lookups
  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    graphData.links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (!map.has(sourceId)) map.set(sourceId, new Set());
      if (!map.has(targetId)) map.set(targetId, new Set());
      map.get(sourceId)!.add(targetId);
      map.get(targetId)!.add(sourceId);
    });
    return map;
  }, [graphData.links]);

  const getNeighborIds = useCallback(
    (nodeId: string): Set<string> => {
      return adjacencyMap.get(nodeId) || new Set();
    },
    [adjacencyMap]
  );

  const getConnectedLinks = useCallback(
    (nodeId: string): any[] => {
      return graphData.links.filter((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return sourceId === nodeId || targetId === nodeId;
      });
    },
    [graphData.links]
  );

  const handleNodeHover = useCallback(
    (node: any) => {
      setHoverNode(node || null);
      if (node) {
        const neighbors = getNeighborIds(node.id);
        const newHighlightNodes = new Set<string>([node.id, ...neighbors]);
        const newHighlightLinks = new Set<any>(
          graphData.links.filter((link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return newHighlightNodes.has(sourceId) && newHighlightNodes.has(targetId);
          })
        );
        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
      } else {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
      }
    },
    [getNeighborIds, graphData.links]
  );

  const highlightSearchNode = useCallback(
    (nodeId: string) => {
      const neighbors = getNeighborIds(nodeId);
      const newHighlightNodes = new Set<string>([nodeId, ...neighbors]);
      const newHighlightLinks = new Set<any>(
        graphData.links.filter((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return newHighlightNodes.has(sourceId) && newHighlightNodes.has(targetId);
        })
      );
      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    },
    [getNeighborIds, graphData.links]
  );

  const clearHighlights = useCallback(() => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setSearchQuery('');
  }, []);

  const togglePin = useCallback((node: any) => {
    setPinnedNodes((prev) => {
      const next = { ...prev };
      if (next[node.id]) {
        delete next[node.id];
        node.fx = undefined;
        node.fy = undefined;
      } else {
        next[node.id] = { fx: node.x, fy: node.y };
        node.fx = node.x;
        node.fy = node.y;
      }
      return next;
    });
  }, []);

  const pinNode = useCallback((node: any, x: number, y: number) => {
    node.fx = x;
    node.fy = y;
    setPinnedNodes((prev) => ({
      ...prev,
      [node.id]: { fx: x, fy: y },
    }));
  }, []);

  const unpinNode = useCallback((node: any) => {
    node.fx = undefined;
    node.fy = undefined;
    setPinnedNodes((prev) => {
      const next = { ...prev };
      delete next[node.id];
      return next;
    });
  }, []);

  const isNodePinned = useCallback(
    (nodeId: string) => !!pinnedNodes[nodeId],
    [pinnedNodes]
  );

  // Apply persisted pins to nodes whenever graphData changes
  const applyPinnedPositions = useCallback(
    (nodes: any[]) => {
      nodes.forEach((node) => {
        const pin = pinnedNodes[node.id];
        if (pin) {
          node.fx = pin.fx;
          node.fy = pin.fy;
        }
      });
    },
    [pinnedNodes]
  );

  const toggleEdgeType = useCallback((type: string) => {
    setFilterState((prev) => ({
      ...prev,
      edgeTypes: { ...prev.edgeTypes, [type]: !prev.edgeTypes[type] },
    }));
  }, []);

  const toggleNodeType = useCallback((type: string) => {
    setFilterState((prev) => ({
      ...prev,
      nodeTypes: { ...prev.nodeTypes, [type]: !prev.nodeTypes[type] },
    }));
  }, []);

  const toggleProject = useCallback((projectId: string) => {
    setFilterState((prev) => ({
      ...prev,
      projects: { ...prev.projects, [projectId]: !prev.projects[projectId] },
    }));
  }, []);

  const toggleMediaType = useCallback((type: string) => {
    setFilterState((prev) => ({
      ...prev,
      mediaTypes: { ...prev.mediaTypes, [type]: !prev.mediaTypes[type] },
    }));
  }, []);

  const initProjectFilters = useCallback((projects: any[]) => {
    setFilterState((prev) => {
      const projectFilters: Record<string, boolean> = {};
      projects.forEach((p) => {
        projectFilters[p._id] = prev.projects[p._id] ?? true;
      });
      return { ...prev, projects: projectFilters };
    });
  }, []);

  return {
    // Highlight
    highlightNodes,
    highlightLinks,
    hoverNode,
    handleNodeHover,
    highlightSearchNode,
    clearHighlights,

    // Pinning
    pinnedNodes,
    togglePin,
    pinNode,
    unpinNode,
    isNodePinned,
    applyPinnedPositions,

    // Search
    searchQuery,
    setSearchQuery,

    // Context menu
    contextMenu,
    setContextMenu,

    // Filters
    filterState,
    toggleEdgeType,
    toggleNodeType,
    toggleProject,
    toggleMediaType,
    initProjectFilters,

    // Helpers
    getNeighborIds,
    getConnectedLinks,
  };
}
