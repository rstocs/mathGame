import { MAP_LAYOUT, type MapNode } from './mapLayout';

interface LevelPathProps {
  nodes?: MapNode[];
}

export function LevelPath({ nodes = MAP_LAYOUT }: LevelPathProps) {
  const d = nodes.map((node, i) => `${i === 0 ? 'M' : 'L'}${node.x},${node.y}`).join(' ');
  return (
    <path
      d={d}
      fill="none"
      stroke="#ffffff"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray="2 22"
      opacity="0.8"
    />
  );
}
