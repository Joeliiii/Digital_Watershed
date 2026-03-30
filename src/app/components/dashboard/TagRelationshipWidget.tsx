import { useRef, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import DashboardWidget from './DashboardWidget';

interface TagRelationshipWidgetProps {
  tags: any[];
  relationships: any[];
  isEditing: boolean;
  onRemove?: () => void;
}

const REL_COLORS: Record<string, string> = {
  related: '#3B82F6',
  parent: '#8B5CF6',
  depends_on: '#F59E0B',
  derived_from: '#10B981',
  contradicts: '#EF4444',
};

const TagRelationshipWidget = ({
  tags,
  relationships,
  isEditing,
  onRemove,
}: TagRelationshipWidgetProps) => {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = useMemo(() => {
    // Only include tags that are part of at least one relationship
    const tagIdsInRels = new Set<string>();
    relationships.forEach((rel: any) => {
      const fromId = typeof rel.fromTagId === 'string' ? rel.fromTagId : rel.fromTagId?._id;
      const toId = typeof rel.toTagId === 'string' ? rel.toTagId : rel.toTagId?._id;
      if (fromId) tagIdsInRels.add(fromId);
      if (toId) tagIdsInRels.add(toId);
    });

    const nodes = tags
      .filter((t: any) => tagIdsInRels.has(t._id))
      .map((t: any) => ({
        id: t._id,
        name: t.name,
        color: t.color || '#3B82F6',
      }));

    const nodeIdSet = new Set(nodes.map((n) => n.id));

    const links = relationships
      .map((rel: any) => {
        const fromId = typeof rel.fromTagId === 'string' ? rel.fromTagId : rel.fromTagId?._id;
        const toId = typeof rel.toTagId === 'string' ? rel.toTagId : rel.toTagId?._id;
        return {
          source: fromId,
          target: toId,
          type: rel.relationshipType || 'related',
          color: REL_COLORS[rel.relationshipType] || '#93C5FD',
        };
      })
      .filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target));

    return { nodes, links };
  }, [tags, relationships]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit(300, 30);
    }, 500);
    return () => clearTimeout(timer);
  }, [graphData]);

  return (
    <DashboardWidget title="Tag Relationships" isEditing={isEditing} onRemove={onRemove}>
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden bg-slate-50">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="name"
            nodeRelSize={6}
            linkColor={(link: any) => link.color || '#93C5FD'}
            linkWidth={2}
            cooldownTicks={60}
            enableZoomInteraction={!isEditing}
            enablePanInteraction={!isEditing}
            enableNodeDrag={!isEditing}
            width={containerRef.current?.clientWidth || 400}
            height={containerRef.current?.clientHeight || 300}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const size = 6;
              const fontSize = Math.max(10 / globalScale, 2);

              // Draw diamond shape for tags
              ctx.beginPath();
              ctx.moveTo(node.x, node.y - size);
              ctx.lineTo(node.x + size, node.y);
              ctx.lineTo(node.x, node.y + size);
              ctx.lineTo(node.x - size, node.y);
              ctx.closePath();
              ctx.fillStyle = node.color || '#3B82F6';
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1.5 / globalScale;
              ctx.stroke();

              // Label
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = '#1E3A8A';
              ctx.fillText(node.name, node.x, node.y + size + 2);
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No tag relationships yet
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default TagRelationshipWidget;
