import { MAP_LAYOUT } from './mapLayout';

export function LevelPath() {
  const d = MAP_LAYOUT.map((node, i) => `${i === 0 ? 'M' : 'L'}${node.x},${node.y}`).join(' ');
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
