import { useCallback, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useWatershed } from '@/app/context/WatershedContext';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const NetworkGraphPage = () => {
  const { media, projects } = useWatershed();
  const fgRef = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Build graph data
  const graphData = {
    nodes: media.map(item => {
      const project = projects.find(p => p.id === item.projectId);
      return {
        id: item.id,
        name: item.title,
        type: item.type,
        tags: item.tags,
        description: item.description,
        color: project?.color || '#3B82F6',
        val: item.relatedMedia.length + 1,
      };
    }),
    links: media.flatMap(item =>
      item.relatedMedia
        .filter(relatedId => media.find(m => m.id === relatedId))
        .map(relatedId => ({
          source: item.id,
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
                    const fontSize = 12/globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    
                    // Draw node circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val * 2, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color;
                    ctx.fill();
                    
                    // Draw node border
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2/globalScale;
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
                  <div className="text-sm text-blue-700 capitalize">{selectedNode.type}</div>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">Connections</div>
                  <div className="text-sm text-blue-700">{selectedNode.val - 1} related items</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
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
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-600" />
                  <span className="text-sm text-gray-700">Node</span>
                </div>
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
