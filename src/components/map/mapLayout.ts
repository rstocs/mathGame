import type { StrandId } from '../../types/game';

export interface MapNode {
  id: StrandId;
  x: number;
  y: number;
}

export const MAP_VIEWBOX = { width: 900, height: 320 };

export const MAP_LAYOUT: MapNode[] = [
  { id: 'ratios-proportions', x: 90, y: 240 },
  { id: 'number-system', x: 280, y: 100 },
  { id: 'expressions-equations', x: 470, y: 240 },
  { id: 'geometry', x: 660, y: 100 },
  { id: 'statistics-probability', x: 830, y: 240 },
];

export function getNodePosition(worldId: StrandId): MapNode {
  return MAP_LAYOUT.find((n) => n.id === worldId) ?? MAP_LAYOUT[0];
}
