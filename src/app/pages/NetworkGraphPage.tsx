import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../services/api';
import { ZoomIn, ZoomOut, Maximize2, Filter, ChevronDown, Layers } from 'lucide-react';
import { getMediaLabel } from '../utils/mediaUtils';

const NetworkGraphPage = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fgRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'media' | 'tags' | 'combined'>('combined');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

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

  // Build graph data from real API items + tag relationships
  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeIdSet = new Set<string>();

    if (viewMode === 'media' || viewMode === 'combined') {
      // Media nodes
      media.forEach((item: any) => {
        const projectId = item.projectIds?.[0];
        const project = projectId
          ? projects.find((p: any) => p._id === (typeof projectId === 'string' ? projectId : projectId._id))
          : null;
        const tagNames = (item.tagIds || []).map((t: any) => typeof t === 'string' ? t : t?.name).filter(Boolean);
        nodes.push({
          id: item._id,
          name: item.title,
          type: 'media',
          mediaType: item.mediaType,
          tags: tagNames,
          description: item.description || '',
          color: project?.color || '#3B82F6',
          val: 2,
          nodeType: 'media',
        });
        nodeIdSet.add(item._id);
      });

      // Shared-tag links between media items
      for (let i = 0; i < media.length; i++) {
        for (let j = i + 1; j < media.length; j++) {
          const tagsA = (media[i].tagIds || []).map((t: any) => typeof t === 'string' ? t : t?._id).filter(Boolean);
          const tagsB = (media[j].tagIds || []).map((t: any) => typeof t === 'string' ? t : t?._id).filter(Boolean);
          const shared = tagsA.filter((t: string) => tagsB.includes(t));
          if (shared.length > 0) {
            links.push({
              source: media[i]._id,
              target: media[j]._id,
              linkType: 'shared-tag',
              color: '#93C5FD',
              width: Math.min(shared.length, 4),
            });
          }
        }
      }
    }

    if (viewMode === 'tags' || viewMode === 'combined') {
      // Tag nodes
      tags.forEach((tag: any) => {
        if (!nodeIdSet.has(tag._id)) {
          nodes.push({
            id: tag._id,
            name: tag.name,
            type: 'tag',
            color: tag.color || '#8B5CF6',
            val: 3,
            nodeType: 'tag',
          });
          nodeIdSet.add(tag._id);
        }
      });

      // Tag relationship links
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
          });
        }
      });

      // Media-to-tag links in combined mode
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
              });
            }
          });
        });
      }
    }

    return { nodes, links };
  }, [media, projects, tags, relationships, viewMode]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.2, 400);
  };

  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.2, 400);
  };

  const handleCenter = () => {
    if (fgRef.current) fgRef.current.zoomToFit(400, 50);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading graph...</p>
      </div>
    </div>
  );

  const viewModes = [
    { id: 'combined', label: 'Combined', description: 'Media items + tag relationships' },
    { id: 'media', label: 'Media Only', description: 'Items linked by shared tags' },
    { id: 'tags', label: 'Tags Only', description: 'Tag relationship network' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-1">Network Graph</h1>
            <p className="text-gray-500">Visualize connections between research materials and tags</p>
          </div>

          {/* View Mode Selector */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-sm hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Filter className="size-4 text-blue-500" />
              <span className="text-blue-700 font-medium">
                {viewModes.find(v => v.id === viewMode)?.label}
              </span>
              <ChevronDown className="size-3.5 text-gray-400" />
            </button>

            {filterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-blue-100 py-1 w-64">
                  {viewModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setViewMode(mode.id);
                        setFilterDropdownOpen(false);
                        setSelectedNode(null);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors ${
                        viewMode === mode.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">{mode.label}</div>
                      <div className="text-[11px] text-gray-400">{mode.description}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Layers className="size-4" /></div>
            <div>
              <div className="text-lg font-bold text-blue-900">{graphData.nodes.length}</div>
              <div className="text-[11px] text-gray-500">Nodes</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600"><Layers className="size-4" /></div>
            <div>
              <div className="text-lg font-bold text-blue-900">{graphData.links.length}</div>
              <div className="text-[11px] text-gray-500">Connections</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><Layers className="size-4" /></div>
            <div>
              <div className="text-lg font-bold text-blue-900">{tags.length}</div>
              <div className="text-[11px] text-gray-500">Tags</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 text-violet-600"><Layers className="size-4" /></div>
            <div>
              <div className="text-lg font-bold text-blue-900">{relationships.length}</div>
              <div className="text-[11px] text-gray-500">Tag Relationships</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Graph Visualization */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden relative">
              <div style={{ height: '700px' }}>
                <ForceGraph2D
                  ref={fgRef}
                  graphData={graphData}
                  nodeLabel="name"
                  nodeRelSize={8}
                  nodeVal="val"
                  linkColor={(link: any) => link.color || '#93C5FD'}
                  linkWidth={(link: any) => link.width || 1}
                  onNodeClick={handleNodeClick}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Inter, sans-serif`;

                    if (node.nodeType === 'tag') {
                      // Diamond shape for tags
                      const size = 7;
                      ctx.beginPath();
                      ctx.moveTo(node.x, node.y - size);
                      ctx.lineTo(node.x + size, node.y);
                      ctx.lineTo(node.x, node.y + size);
                      ctx.lineTo(node.x - size, node.y);
                      ctx.closePath();
                      ctx.fillStyle = node.color || '#8B5CF6';
                      ctx.fill();
                      ctx.strokeStyle = '#ffffff';
                      ctx.lineWidth = 2 / globalScale;
                      ctx.stroke();

                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillStyle = '#5B21B6';
                      ctx.fillText(label, node.x, node.y + size + fontSize);
                    } else {
                      // Circle for media
                      const r = node.val * 2;
                      ctx.beginPath();
                      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                      ctx.fillStyle = node.color;
                      ctx.fill();
                      ctx.strokeStyle = '#ffffff';
                      ctx.lineWidth = 2 / globalScale;
                      ctx.stroke();

                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillStyle = '#1E3A8A';
                      ctx.fillText(label, node.x, node.y + r + fontSize);
                    }
                  }}
                  cooldownTicks={100}
                  onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
                />
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button onClick={handleZoomIn} className="p-2 bg-white rounded-lg shadow-md border border-blue-200 hover:bg-blue-50 transition-colors" title="Zoom In">
                  <ZoomIn className="size-5 text-blue-700" />
                </button>
                <button onClick={handleZoomOut} className="p-2 bg-white rounded-lg shadow-md border border-blue-200 hover:bg-blue-50 transition-colors" title="Zoom Out">
                  <ZoomOut className="size-5 text-blue-700" />
                </button>
                <button onClick={handleCenter} className="p-2 bg-white rounded-lg shadow-md border border-blue-200 hover:bg-blue-50 transition-colors" title="Center View">
                  <Maximize2 className="size-5 text-blue-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Node Details Panel */}
          <div className="lg:col-span-1 space-y-4">
            {selectedNode ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Node Details</h3>
                <div className="mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg mb-3 flex items-center justify-center ${
                      selectedNode.nodeType === 'tag' ? 'rotate-45' : ''
                    }`}
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <h4 className="font-semibold text-blue-900 mb-1">{selectedNode.name}</h4>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                    selectedNode.nodeType === 'tag'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedNode.nodeType || 'media'}
                  </span>
                </div>

                {selectedNode.description && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Description</div>
                    <p className="text-sm text-gray-600">{selectedNode.description}</p>
                  </div>
                )}

                {selectedNode.mediaType && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Type</div>
                    <div className="text-sm text-blue-700">{getMediaLabel(selectedNode.mediaType)}</div>
                  </div>
                )}

                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Node Details</h3>
                <p className="text-sm text-gray-600">Click on a node to view its details</p>
              </div>
            )}

            {/* Legend */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Legend</h3>
              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Nodes</div>
                {projects.map((p: any) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color || '#3B82F6' }} />
                    <span className="text-sm text-gray-700">{p.title || p.name} (media)</span>
                  </div>
                ))}
                {viewMode !== 'media' && (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rotate-45 bg-purple-500 rounded-sm" />
                    <span className="text-sm text-gray-700">Tag</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">Connections</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-0.5 bg-blue-300" />
                      <span className="text-xs text-gray-600">Shared tags</span>
                    </div>
                    {viewMode !== 'media' && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-0.5 bg-purple-500" />
                          <span className="text-xs text-gray-600">Parent→Child</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-0.5 bg-blue-500" />
                          <span className="text-xs text-gray-600">Related</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraphPage;
