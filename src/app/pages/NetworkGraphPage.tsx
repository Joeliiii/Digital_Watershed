import { useCallback, useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../services/api';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { getMediaLabel } from '../utils/mediaUtils';

const NetworkGraphPage = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fgRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaData, projectsData] = await Promise.all([
          api.getItems(),
          api.getProjects(),
        ]);
        setMedia(mediaData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to load graph data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build graph data from real API items
  const graphData = {
    nodes: media.map((item: any) => {
      // Find first project linked to this item
      const projectId = item.projectIds?.[0];
      const project = projectId
        ? projects.find((p: any) => p._id === (typeof projectId === 'string' ? projectId : projectId._id))
        : null;
      const tagNames = (item.tagIds || []).map((t: any) => typeof t === 'string' ? t : t?.name).filter(Boolean);
      return {
        id: item._id,
        name: item.title,
        type: item.mediaType,
        tags: tagNames,
        description: item.description || '',
        color: project?.color || '#3B82F6',
        val: (item.relatedMedia?.length || 0) + 1,
      };
    }),
    links: media.flatMap((item: any) =>
      (item.relatedMedia || [])
        .filter((relatedId: string) => media.find((m: any) => m._id === relatedId))
        .map((relatedId: string) => ({
          source: item._id,
          target: relatedId,
        }))
    ),
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.2, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.2, 400);
    }
  };

  const handleCenter = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading graph...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Network Graph</h1>
          <p className="text-gray-600">Visualize connections between research materials</p>
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
                  nodeColor="color"
                  nodeRelSize={8}
                  nodeVal="val"
                  linkColor={() => '#93C5FD'}
                  linkWidth={2}
                  onNodeClick={handleNodeClick}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;

                    // Draw node circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val * 2, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color;
                    ctx.fill();

                    // Draw node border
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2 / globalScale;
                    ctx.stroke();

                    // Draw label
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#1E3A8A';
                    ctx.fillText(label, node.x, node.y + node.val * 2 + fontSize);
                  }}
                  cooldownTicks={100}
                  onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
                />
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white rounded-lg shadow-md border border-blue-200 hover:bg-blue-50 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="size-5 text-blue-700" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white rounded-lg shadow-md border border-blue-200 hover:bg-blue-50 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-5 text-blue-700" />
                </button>
                <button
                  onClick={handleCenter}
                  className="p-2 bg-white rounded-lg shadow-md border border-blue-200 hover:bg-blue-50 transition-colors"
                  title="Center View"
                >
                  <Maximize2 className="size-5 text-blue-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Node Details Panel */}
          <div className="lg:col-span-1">
            {selectedNode ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Node Details</h3>

                <div className="mb-4">
                  <div
                    className="w-12 h-12 rounded-lg mb-3"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <h4 className="font-semibold text-blue-900 mb-2">{selectedNode.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{selectedNode.description}</p>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">Type</div>
                  <div className="text-sm text-blue-700">{getMediaLabel(selectedNode.type)}</div>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">Connections</div>
                  <div className="text-sm text-blue-700">{selectedNode.val - 1} related items</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.tags.length > 0 ? selectedNode.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
                      >
                        {tag}
                      </span>
                    )) : (
                      <span className="text-xs text-gray-400">No tags</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Node Details</h3>
                <p className="text-sm text-gray-600">Click on a node to view its details</p>
              </div>
            )}

            {/* Legend */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 mt-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Legend</h3>

              <div className="space-y-3">
                {projects.map((p: any) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color || '#3B82F6' }} />
                    <span className="text-sm text-gray-700">{p.title || p.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-0.5 bg-blue-300" />
                  <span className="text-sm text-gray-700">Connection</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Node size represents the number of connections. Colors indicate different projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraphPage;
