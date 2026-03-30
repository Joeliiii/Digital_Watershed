import { useRef, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import DashboardWidget from './DashboardWidget';

interface MiniGraphWidgetProps {
  media: any[];
  projects: any[];
  isEditing: boolean;
  onRemove?: () => void;
}

const MiniGraphWidget = ({ media, projects, isEditing, onRemove }: MiniGraphWidgetProps) => {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = useMemo(() => {
    const nodes = media.map((item: any) => {
      const projectId = item.projectIds?.[0];
      const project = projectId
        ? projects.find(
            (p: any) =>
              p._id === (typeof projectId === 'string' ? projectId : projectId._id)
          )
        : null;
      return {
        id: item._id,
        name: item.title,
        color: project?.color || '#3B82F6',
        val: (item.relatedMedia?.length || 0) + 1,
      };
    });

    const links = media.flatMap((item: any) =>
      (item.relatedMedia || [])
        .filter((relatedId: string) => media.find((m: any) => m._id === relatedId))
        .map((relatedId: string) => ({
          source: item._id,
          target: relatedId,
        }))
    );

    // Add shared-tag links (items sharing ≥ 1 tag)
    for (let i = 0; i < media.length; i++) {
      for (let j = i + 1; j < media.length; j++) {
        const tagsA = (media[i].tagIds || []).map((t: any) =>
          typeof t === 'string' ? t : t?._id
        );
        const tagsB = (media[j].tagIds || []).map((t: any) =>
          typeof t === 'string' ? t : t?._id
        );
        const shared = tagsA.filter((t: string) => tagsB.includes(t));
        if (
          shared.length > 0 &&
          !links.some(
            (l: any) =>
              (l.source === media[i]._id && l.target === media[j]._id) ||
              (l.source === media[j]._id && l.target === media[i]._id)
          )
        ) {
          links.push({ source: media[i]._id, target: media[j]._id });
        }
      }
    }

    return { nodes, links };
  }, [media, projects]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit(300, 30);
    }, 500);
    return () => clearTimeout(timer);
  }, [graphData]);

  return (
    <DashboardWidget title="Network Preview" isEditing={isEditing} onRemove={onRemove}>
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden bg-slate-50">
        {media.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="name"
            nodeColor="color"
            nodeRelSize={4}
            nodeVal="val"
            linkColor={() => '#CBD5E1'}
            linkWidth={1}
            cooldownTicks={60}
            enableZoomInteraction={!isEditing}
            enablePanInteraction={!isEditing}
            enableNodeDrag={!isEditing}
            width={containerRef.current?.clientWidth || 400}
            height={containerRef.current?.clientHeight || 300}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const size = Math.sqrt(node.val || 1) * 3;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
              ctx.fillStyle = node.color || '#3B82F6';
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1 / globalScale;
              ctx.stroke();
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No data to graph
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default MiniGraphWidget;
