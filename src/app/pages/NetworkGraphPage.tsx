import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { forceRadial, forceX, forceY } from 'd3-force';
import { api } from '../services/api';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  MapPin,
} from 'lucide-react';
import { getMediaLabel, getMediaCategory } from '../utils/mediaUtils';
import { useGraphInteractions } from '../hooks/useGraphInteractions';
import GraphFilterPanel from '../components/graph/GraphFilterPanel';
import GraphSearchBar from '../components/graph/GraphSearchBar';
import GraphStatsBar from '../components/graph/GraphStatsBar';
import GraphContextMenu from '../components/graph/GraphContextMenu';
import GraphViewModeSelector from '../components/graph/GraphViewModeSelector';
import type { LayoutMode } from '../components/graph/GraphViewModeSelector';

const NetworkGraphPage = () => {
  const navigate = useNavigate();
  const [media, setMedia] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fgRef = useRef<any>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'media' | 'tags' | 'combined'>('combined');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 700 });

  // Fetch data
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
        console.error('Failed to load graph data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build unfiltered graph data
  const rawGraphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeIdSet = new Set<string>();

    if (viewMode === 'media' || viewMode === 'combined') {
      media.forEach((item: any) => {
        const projectId = item.projectIds?.[0];
        const project = projectId
          ? projects.find(
              (p: any) => p._id === (typeof projectId === 'string' ? projectId : projectId._id)
            )
          : null;
        const tagNames = (item.tagIds || [])
          .map((t: any) => (typeof t === 'string' ? t : t?.name))
          .filter(Boolean);
        const mediaCategory = getMediaCategory(item.mediaType || item.metadata?.mimetype || '');
        nodes.push({
          id: item._id,
          name: item.title,
          type: 'media',
          mediaType: item.mediaType || item.metadata?.mimetype || '',
          mediaCategory,
          tags: tagNames,
          description: item.description || '',
          color: project?.color || '#3B82F6',
          val: 2,
          nodeType: 'media',
          projectId: typeof projectId === 'string' ? projectId : projectId?._id || null,
        });
        nodeIdSet.add(item._id);
      });

      // Shared-tag links between media items
      for (let i = 0; i < media.length; i++) {
        for (let j = i + 1; j < media.length; j++) {
          const tagsA = (media[i].tagIds || [])
            .map((t: any) => (typeof t === 'string' ? t : t?._id))
            .filter(Boolean);
          const tagsB = (media[j].tagIds || [])
            .map((t: any) => (typeof t === 'string' ? t : t?._id))
            .filter(Boolean);
          const shared = tagsA.filter((t: string) => tagsB.includes(t));
          if (shared.length > 0) {
            links.push({
              source: media[i]._id,
              target: media[j]._id,
              linkType: 'shared-tag',
              color: '#93C5FD',
              width: Math.min(shared.length, 6),
              sharedCount: shared.length,
            });
          }
        }
      }
    }

    if (viewMode === 'tags' || viewMode === 'combined') {
      tags.forEach((tag: any) => {
        if (!nodeIdSet.has(tag._id)) {
          nodes.push({
            id: tag._id,
            name: tag.name,
            type: 'tag',
            color: tag.color || '#8B5CF6',
            val: 3,
            nodeType: 'tag',
            projectId: null,
            mediaCategory: null,
          });
          nodeIdSet.add(tag._id);
        }
      });

      relationships.forEach((rel: any) => {
        const fromId = typeof rel.fromTagId === 'string' ? rel.fromTagId : rel.fromTagId?._id;
        const toId = typeof rel.toTagId === 'string' ? rel.toTagId : rel.toTagId?._id;
        if (fromId && toId && nodeIdSet.has(fromId) && nodeIdSet.has(toId)) {
          const relColors: Record<string, string> = {
            related: '#3B82F6',
            parent: '#8B5CF6',
            depends_on: '#F59E0B',
            derived_from: '#10B981',
            contradicts: '#EF4444',
          };
          links.push({
            source: fromId,
            target: toId,
            linkType: rel.relationshipType || 'related',
            color: relColors[rel.relationshipType] || '#93C5FD',
            width: 2,
            sharedCount: 1,
          });
        }
      });

      if (viewMode === 'combined') {
        media.forEach((item: any) => {
          (item.tagIds || []).forEach((tag: any) => {
            const tagId = typeof tag === 'string' ? tag : tag?._id;
            if (tagId && nodeIdSet.has(tagId)) {
              links.push({
                source: item._id,
                target: tagId,
                linkType: 'media-tag',
                color: '#E2E8F0',
                width: 0.5,
                sharedCount: 1,
              });
            }
          });
        });
      }
    }

    return { nodes, links };
  }, [media, projects, tags, relationships, viewMode]);

  // Graph interactions hook
  const interactions = useGraphInteractions(rawGraphData);

  // Initialize project filters when projects load
  useEffect(() => {
    if (projects.length > 0) {
      interactions.initProjectFilters(projects);
    }
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters to graph data
  const graphData = useMemo(() => {
    const { filterState } = interactions;

    const filteredNodes = rawGraphData.nodes.filter((node) => {
      // Node type filter
      if (!filterState.nodeTypes[node.nodeType]) return false;

      // Media type filter (only for media nodes)
      if (node.nodeType === 'media' && node.mediaCategory) {
        if (!filterState.mediaTypes[node.mediaCategory]) return false;
      }

      // Project filter (only for media nodes with a projectId)
      if (node.nodeType === 'media' && node.projectId) {
        if (filterState.projects[node.projectId] === false) return false;
      }

      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = rawGraphData.links.filter((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      // Both endpoints must be in filtered nodes
      if (!filteredNodeIds.has(sourceId) || !filteredNodeIds.has(targetId)) return false;

      // Edge type filter
      if (!filterState.edgeTypes[link.linkType]) return false;

      return true;
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [rawGraphData, interactions.filterState]);

  // Apply pinned positions whenever graphData changes
  useEffect(() => {
    interactions.applyPinnedPositions(graphData.nodes);
  }, [graphData.nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize observer for graph dimensions
  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setGraphDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Layout mode: apply d3 forces
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    if (layoutMode === 'force') {
      fg.d3Force('x', null);
      fg.d3Force('y', null);
      fg.d3Force('radial', null);
      fg.d3ReheatSimulation();
    } else if (layoutMode === 'radial') {
      fg.d3Force('x', null);
      fg.d3Force('y', null);

      // Center on selected node or the highest-degree node
      const centerNode = selectedNode || graphData.nodes[0];
      if (centerNode) {
        const cx = centerNode.x || 0;
        const cy = centerNode.y || 0;

        const neighbors = interactions.getNeighborIds(centerNode.id);

        fg.d3Force(
          'radial',
          forceRadial((node: any) => {
              if (node.id === centerNode.id) return 0;
              if (neighbors.has(node.id)) return 150;
              return 300;
            }, cx, cy)
            .strength(0.8)
        );
      }
      fg.d3ReheatSimulation();
    } else if (layoutMode === 'cluster') {
      fg.d3Force('radial', null);

      // Compute cluster centers arranged in a grid
      const projectIds = [...new Set(graphData.nodes.map((n) => n.projectId || '__unassigned__'))];
      const cols = Math.ceil(Math.sqrt(projectIds.length));
      const spacing = 300;
      const clusterCenters: Record<string, { x: number; y: number }> = {};
      projectIds.forEach((pid, i) => {
        clusterCenters[pid] = {
          x: (i % cols) * spacing - ((cols - 1) * spacing) / 2,
          y: Math.floor(i / cols) * spacing - ((Math.ceil(projectIds.length / cols) - 1) * spacing) / 2,
        };
      });

      fg.d3Force(
        'x',
        forceX((node: any) => {
            const key = node.projectId || '__unassigned__';
            return clusterCenters[key]?.x || 0;
          })
          .strength(0.6)
      );
      fg.d3Force(
        'y',
        forceY((node: any) => {
            const key = node.projectId || '__unassigned__';
            return clusterCenters[key]?.y || 0;
          })
          .strength(0.6)
      );
      fg.d3ReheatSimulation();
    }
  }, [layoutMode, selectedNode, graphData.nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNode(node);
      interactions.setContextMenu(null);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleNodeDoubleClick = useCallback(
    (node: any) => {
      if (!fgRef.current) return;
      // Zoom to fit the node's neighborhood
      const neighbors = interactions.getNeighborIds(node.id);
      const neighborNodes = graphData.nodes.filter(
        (n) => n.id === node.id || neighbors.has(n.id)
      );
      if (neighborNodes.length > 0) {
        const padding = 60;
        const xs = neighborNodes.map((n: any) => n.x || 0);
        const ys = neighborNodes.map((n: any) => n.y || 0);
        const minX = Math.min(...xs) - padding;
        const maxX = Math.max(...xs) + padding;
        const minY = Math.min(...ys) - padding;
        const maxY = Math.max(...ys) + padding;
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const zoomLevel = Math.min(
          graphDimensions.width / (maxX - minX),
          graphDimensions.height / (maxY - minY)
        );
        fgRef.current.centerAt(cx, cy, 600);
        fgRef.current.zoom(zoomLevel, 600);
      }
    },
    [graphData.nodes, graphDimensions] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleNodeRightClick = useCallback(
    (node: any, event: MouseEvent) => {
      event.preventDefault();
      interactions.setContextMenu({ x: event.clientX, y: event.clientY, node });
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleNodeDragEnd = useCallback(
    (node: any) => {
      if (node.x !== undefined && node.y !== undefined) {
        interactions.pinNode(node, node.x, node.y);
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleLinkHover = useCallback((_link: any) => {
    // Link hover tooltip is drawn via linkCanvasObject
  }, []);

  const handleSearchSelect = useCallback(
    (nodeId: string) => {
      interactions.highlightSearchNode(nodeId);
      interactions.setSearchQuery(
        graphData.nodes.find((n) => n.id === nodeId)?.name || ''
      );
      // Pan to node
      const node = graphData.nodes.find((n) => n.id === nodeId);
      if (node && fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 500);
        fgRef.current.zoom(2, 500);
      }
    },
    [graphData.nodes] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleFocusNeighborhood = useCallback(
    (node: any) => {
      handleNodeDoubleClick(node);
      interactions.highlightSearchNode(node.id);
    },
    [handleNodeDoubleClick] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400);
  };
  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400);
  };
  const handleCenter = () => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 50);
  };

  const toggleFullscreen = async () => {
    const container = graphContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // Determine if there's an active search/hover highlight
  const hasHighlight = interactions.highlightNodes.size > 0;

  // Node rendering
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Inter, sans-serif`;

      const isHovered = interactions.hoverNode?.id === node.id;
      const isHighlighted = interactions.highlightNodes.has(node.id);
      const isPinned = interactions.isNodePinned(node.id);
      const dimmed = hasHighlight && !isHighlighted;

      // Set opacity
      ctx.globalAlpha = dimmed ? 0.12 : 1;

      if (node.nodeType === 'tag') {
        // Diamond shape for tags
        const size = 7;

        // Glow effect for hovered/highlighted
        if (isHovered || (isHighlighted && !dimmed)) {
          ctx.save();
          ctx.shadowColor = node.color || '#8B5CF6';
          ctx.shadowBlur = isHovered ? 20 : 10;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y - size);
          ctx.lineTo(node.x + size, node.y);
          ctx.lineTo(node.x, node.y + size);
          ctx.lineTo(node.x - size, node.y);
          ctx.closePath();
          ctx.fillStyle = node.color || '#8B5CF6';
          ctx.fill();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.moveTo(node.x, node.y - size);
        ctx.lineTo(node.x + size, node.y);
        ctx.lineTo(node.x, node.y + size);
        ctx.lineTo(node.x - size, node.y);
        ctx.closePath();
        ctx.fillStyle = node.color || '#8B5CF6';
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#FDE68A' : '#ffffff';
        ctx.lineWidth = (isHovered ? 3 : 2) / globalScale;
        ctx.stroke();

        // Label
        if (!dimmed) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = dimmed ? 'rgba(91,33,182,0.3)' : '#5B21B6';
          ctx.fillText(label, node.x, node.y + size + fontSize);
        }
      } else {
        // Circle for media
        const r = node.val * 2;

        // Glow effect for hovered/highlighted
        if (isHovered || (isHighlighted && !dimmed)) {
          ctx.save();
          ctx.shadowColor = node.color;
          ctx.shadowBlur = isHovered ? 20 : 10;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#FDE68A' : '#ffffff';
        ctx.lineWidth = (isHovered ? 3 : 2) / globalScale;
        ctx.stroke();

        // Label
        if (!dimmed) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = dimmed ? 'rgba(30,58,138,0.3)' : '#1E3A8A';
          ctx.fillText(label, node.x, node.y + r + fontSize);
        }
      }

      // Pin indicator
      if (isPinned && !dimmed) {
        const pinSize = 4 / globalScale;
        ctx.save();
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(
          node.x + (node.nodeType === 'tag' ? 7 : node.val * 2) + pinSize,
          node.y - (node.nodeType === 'tag' ? 7 : node.val * 2),
          pinSize,
          0,
          2 * Math.PI
        );
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();
        ctx.restore();
      }

      // Search match ring
      if (isHighlighted && interactions.searchQuery && node.name?.toLowerCase().includes(interactions.searchQuery.toLowerCase())) {
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3 / globalScale;
        ctx.setLineDash([4 / globalScale, 4 / globalScale]);
        if (node.nodeType === 'tag') {
          const s = 10;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y - s);
          ctx.lineTo(node.x + s, node.y);
          ctx.lineTo(node.x, node.y + s);
          ctx.lineTo(node.x - s, node.y);
          ctx.closePath();
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val * 2 + 3, 0, 2 * Math.PI);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    },
    [hasHighlight, interactions.hoverNode, interactions.highlightNodes, interactions.isNodePinned, interactions.searchQuery]
  );

  // Connected nodes for sidebar
  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const neighborIds = interactions.getNeighborIds(selectedNode.id);
    const connectedLinks = interactions.getConnectedLinks(selectedNode.id);

    return [...neighborIds].map((nid) => {
      const node = graphData.nodes.find((n) => n.id === nid);
      const link = connectedLinks.find((l: any) => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return (sid === nid || tid === nid);
      });
      return {
        id: nid,
        name: node?.name || 'Unknown',
        nodeType: node?.nodeType || 'media',
        color: node?.color || '#3B82F6',
        linkType: link?.linkType || 'unknown',
      };
    });
  }, [selectedNode, graphData.nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading graph...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className={`${isFullscreen ? '' : 'container mx-auto px-6 py-8'}`}>
        {/* Header — hidden in fullscreen */}
        {!isFullscreen && (
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-blue-900 mb-1">Network Graph</h1>
              <p className="text-gray-500">
                Visualize connections between research materials and tags
              </p>
            </div>
          </div>
        )}

        <div className={`grid ${isFullscreen ? '' : 'grid-cols-1 lg:grid-cols-4'} gap-6`}>
          {/* Graph Visualization */}
          <div className={isFullscreen ? 'col-span-full' : 'lg:col-span-3'}>
            <div
              ref={graphContainerRef}
              className={`bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden relative ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
              }`}
              style={isFullscreen ? undefined : { height: '700px' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Search Bar */}
              <GraphSearchBar
                nodes={graphData.nodes}
                searchQuery={interactions.searchQuery}
                setSearchQuery={interactions.setSearchQuery}
                onSelectNode={handleSearchSelect}
                onClear={interactions.clearHighlights}
              />

              {/* Filter Panel */}
              <GraphFilterPanel
                filterState={interactions.filterState}
                projects={projects}
                toggleEdgeType={interactions.toggleEdgeType}
                toggleNodeType={interactions.toggleNodeType}
                toggleProject={interactions.toggleProject}
                toggleMediaType={interactions.toggleMediaType}
              />

              {/* View Mode Selector */}
              <GraphViewModeSelector
                layoutMode={layoutMode}
                setLayoutMode={setLayoutMode}
                viewMode={viewMode}
                setViewMode={(mode) => {
                  setViewMode(mode);
                  setSelectedNode(null);
                }}
              />

              {/* Graph Canvas */}
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeLabel=""
                nodeRelSize={8}
                nodeVal="val"
                nodeCanvasObject={nodeCanvasObject}
                linkColor={(link: any) => {
                  if (hasHighlight && !interactions.highlightLinks.has(link)) {
                    return 'rgba(200,200,200,0.08)';
                  }
                  return link.color || '#93C5FD';
                }}
                linkWidth={(link: any) => {
                  if (hasHighlight && interactions.highlightLinks.has(link)) {
                    return (link.width || 1) * 1.5;
                  }
                  return link.width || 1;
                }}
                linkDirectionalArrowLength={(link: any) =>
                  link.linkType === 'parent' ? 6 : 0
                }
                linkDirectionalArrowRelPos={1}
                linkDirectionalArrowColor={(link: any) => link.color || '#8B5CF6'}
                linkLineDash={(link: any) =>
                  link.linkType === 'contradicts' ? [4, 2] : null
                }
                onNodeClick={handleNodeClick}
                onNodeRightClick={handleNodeRightClick}
                onNodeHover={interactions.handleNodeHover}
                onLinkHover={handleLinkHover}
                onNodeDragEnd={handleNodeDragEnd}
                cooldownTicks={100}
                onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
                width={graphDimensions.width}
                height={graphDimensions.height}
                enableNodeDrag={true}
              />

              {/* Stats Bar */}
              <GraphStatsBar nodes={graphData.nodes} links={graphData.links} />

              {/* Zoom Controls */}
              <div className="absolute bottom-14 right-4 flex flex-col gap-1.5 z-30">
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="size-4 text-blue-700" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-4 text-blue-700" />
                </button>
                <button
                  onClick={handleCenter}
                  className="p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                  title="Fit to View"
                >
                  <Maximize2 className="size-4 text-blue-700" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="size-4 text-blue-700" />
                  ) : (
                    <Maximize2 className="size-4 text-indigo-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar — hidden in fullscreen */}
          {!isFullscreen && (
            <div className="lg:col-span-1 space-y-4">
              {selectedNode ? (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                  <h3 className="text-base font-semibold text-blue-900 mb-4">Node Details</h3>
                  <div className="mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                        selectedNode.nodeType === 'tag' ? 'rotate-45' : ''
                      }`}
                      style={{ backgroundColor: selectedNode.color }}
                    />
                    <h4 className="font-semibold text-blue-900 mb-1">{selectedNode.name}</h4>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                        selectedNode.nodeType === 'tag'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {selectedNode.nodeType || 'media'}
                    </span>
                    {interactions.isNodePinned(selectedNode.id) && (
                      <span className="inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                        <MapPin className="size-3 inline mr-0.5" />
                        Pinned
                      </span>
                    )}
                  </div>

                  {selectedNode.description && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Description
                      </div>
                      <p className="text-sm text-gray-600">{selectedNode.description}</p>
                    </div>
                  )}

                  {selectedNode.mediaType && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">Type</div>
                      <div className="text-sm text-blue-700">
                        {getMediaLabel(selectedNode.mediaType)}
                      </div>
                    </div>
                  )}

                  {selectedNode.tags && selectedNode.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pin controls */}
                  <div className="mb-4 border-t border-gray-100 pt-3">
                    {interactions.isNodePinned(selectedNode.id) ? (
                      <button
                        onClick={() => interactions.unpinNode(selectedNode)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-colors"
                      >
                        <MapPin className="size-3.5" /> Release Pin
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (selectedNode.x !== undefined) {
                            interactions.pinNode(selectedNode, selectedNode.x, selectedNode.y);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        <MapPin className="size-3.5" /> Pin Position
                      </button>
                    )}
                  </div>

                  {/* Connected-To List */}
                  {connectedNodes.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Connected To ({connectedNodes.length})
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {connectedNodes.map((cn) => (
                          <button
                            key={cn.id}
                            onClick={() => {
                              const node = graphData.nodes.find((n) => n.id === cn.id);
                              if (node) {
                                setSelectedNode(node);
                                fgRef.current?.centerAt(node.x, node.y, 500);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors text-left"
                          >
                            <div
                              className={`w-2.5 h-2.5 shrink-0 ${
                                cn.nodeType === 'tag' ? 'rotate-45 rounded-sm' : 'rounded-full'
                              }`}
                              style={{ backgroundColor: cn.color }}
                            />
                            <span className="text-sm text-gray-700 truncate flex-1">
                              {cn.name}
                            </span>
                            <span className="text-[9px] text-gray-400 uppercase shrink-0">
                              {cn.linkType}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigate button for media nodes */}
                  {selectedNode.nodeType !== 'tag' && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <button
                        onClick={() => navigate(`/media/${selectedNode.id}`)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        View Media Detail
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                  <h3 className="text-base font-semibold text-blue-900 mb-4">Node Details</h3>
                  <p className="text-sm text-gray-500">Click on a node to view its details</p>
                </div>
              )}

              {/* Legend */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
                <h3 className="text-base font-semibold text-blue-900 mb-3">Legend</h3>
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Nodes</div>
                  {projects.map((p: any) => (
                    <div key={p._id} className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: p.color || '#3B82F6' }}
                      />
                      <span className="text-sm text-gray-700">{p.title || p.name}</span>
                    </div>
                  ))}
                  {viewMode !== 'media' && (
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rotate-45 bg-purple-500 rounded-sm" />
                      <span className="text-sm text-gray-700">Tag</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-white shadow-sm" />
                    <span className="text-sm text-gray-700">Pinned indicator</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Connections
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-0.5 bg-blue-300" />
                        <span className="text-xs text-gray-600">Shared tags (thicker = more)</span>
                      </div>
                      {viewMode !== 'media' && (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-purple-500 relative">
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-purple-500 border-y-[3px] border-y-transparent" />
                            </div>
                            <span className="text-xs text-gray-600">Parent→Child</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-blue-500" />
                            <span className="text-xs text-gray-600">Related</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-amber-500" />
                            <span className="text-xs text-gray-600">Depends On</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 bg-emerald-500" />
                            <span className="text-xs text-gray-600">Derived From</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-0.5 border-t-2 border-dashed border-red-500" />
                            <span className="text-xs text-gray-600">Contradicts</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <GraphContextMenu
        contextMenu={interactions.contextMenu}
        onClose={() => interactions.setContextMenu(null)}
        isNodePinned={interactions.isNodePinned}
        onTogglePin={interactions.togglePin}
        onFocusNeighborhood={handleFocusNeighborhood}
      />
    </div>
  );
};

export default NetworkGraphPage;
