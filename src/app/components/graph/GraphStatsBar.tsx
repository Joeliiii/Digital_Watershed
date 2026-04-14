import { useMemo } from 'react';
import { Activity, GitBranch, Waypoints, BarChart3 } from 'lucide-react';

interface GraphStatsBarProps {
  nodes: any[];
  links: any[];
}

const GraphStatsBar = ({ nodes, links }: GraphStatsBarProps) => {
  const stats = useMemo(() => {
    const nodeCount = nodes.length;
    const edgeCount = links.length;

    // Connected components via BFS
    const adj = new Map<string, Set<string>>();
    nodes.forEach((n) => adj.set(n.id, new Set()));
    links.forEach((l: any) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    });

    let clusters = 0;
    const visited = new Set<string>();
    nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        clusters++;
        const queue = [n.id];
        while (queue.length) {
          const curr = queue.shift()!;
          if (visited.has(curr)) continue;
          visited.add(curr);
          adj.get(curr)?.forEach((neighbor) => {
            if (!visited.has(neighbor)) queue.push(neighbor);
          });
        }
      }
    });

    // Graph density
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxEdges > 0 ? (edgeCount / maxEdges) * 100 : 0;

    return { nodeCount, edgeCount, clusters, density };
  }, [nodes, links]);

  const statItems = [
    { icon: Waypoints, label: 'Nodes', value: stats.nodeCount, color: 'text-blue-500' },
    { icon: GitBranch, label: 'Edges', value: stats.edgeCount, color: 'text-indigo-500' },
    { icon: Activity, label: 'Clusters', value: stats.clusters, color: 'text-emerald-500' },
    { icon: BarChart3, label: 'Density', value: `${stats.density.toFixed(1)}%`, color: 'text-amber-500' },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
        {statItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center">
              {i > 0 && <div className="w-px h-5 bg-gray-200 mx-1" />}
              <div className="flex items-center gap-1.5 px-2.5 py-1">
                <Icon className={`size-3.5 ${item.color}`} />
                <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                <span className="text-[10px] text-gray-400">{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GraphStatsBar;
