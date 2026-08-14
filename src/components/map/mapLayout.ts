import { useEffect, useState } from 'react';
import type { StrandId } from '../../types/game';

export interface MapNode {
  id: StrandId;
  x: number;
  y: number;
}

export interface MapViewBox {
  width: number;
  height: number;
}

export const MAP_VIEWBOX: MapViewBox = { width: 900, height: 320 };

/** Wide zig-zag trail, used from tablet width up. */
export const MAP_LAYOUT: MapNode[] = [
  { id: 'ratios-proportions', x: 90, y: 240 },
  { id: 'number-system', x: 280, y: 100 },
  { id: 'expressions-equations', x: 470, y: 240 },
  { id: 'geometry', x: 660, y: 100 },
  { id: 'statistics-probability', x: 830, y: 240 },
];

export const MAP_VIEWBOX_PORTRAIT: MapViewBox = { width: 380, height: 820 };

/**
 * Phone layout: the same trail turned vertical. Squeezing the 900-wide zig-zag
 * into a ~375px screen shrank it to a ~130px strip with unreadable labels and
 * clipped "Statistics Summit" against the right edge.
 */
export const MAP_LAYOUT_PORTRAIT: MapNode[] = [
  { id: 'ratios-proportions', x: 115, y: 95 },
  { id: 'number-system', x: 265, y: 245 },
  { id: 'expressions-equations', x: 115, y: 395 },
  { id: 'geometry', x: 265, y: 545 },
  { id: 'statistics-probability', x: 115, y: 695 },
];

const PORTRAIT_QUERY = '(max-width: 640px)';

/** Picks the trail that fits the viewport, and re-picks on rotate/resize. */
export function useMapLayout(): { nodes: MapNode[]; viewBox: MapViewBox } {
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PORTRAIT_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(PORTRAIT_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsPortrait(event.matches);
    mql.addEventListener('change', onChange);
    setIsPortrait(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isPortrait
    ? { nodes: MAP_LAYOUT_PORTRAIT, viewBox: MAP_VIEWBOX_PORTRAIT }
    : { nodes: MAP_LAYOUT, viewBox: MAP_VIEWBOX };
}

export function getNodePosition(worldId: StrandId, nodes: MapNode[] = MAP_LAYOUT): MapNode {
  return nodes.find((n) => n.id === worldId) ?? nodes[0];
}
