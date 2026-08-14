import { useEffect, useState } from 'react';

export interface MapNode {
  x: number;
  y: number;
}

export interface MapViewBox {
  width: number;
  height: number;
}

/**
 * Node positions are indexed by position on the map rather than keyed by world,
 * so the same layouts serve every grade regardless of how many worlds it has.
 */
export const MAP_VIEWBOX: MapViewBox = { width: 900, height: 320 };

/** Wide zig-zag trail, used from tablet width up. */
export const MAP_LAYOUT: MapNode[] = [
  { x: 90, y: 240 },
  { x: 280, y: 100 },
  { x: 470, y: 240 },
  { x: 660, y: 100 },
  { x: 830, y: 240 },
];

export const MAP_VIEWBOX_PORTRAIT: MapViewBox = { width: 380, height: 820 };

/**
 * Phone layout: the same trail turned vertical. Squeezing the 900-wide zig-zag
 * into a ~375px screen shrank it to a ~130px strip with unreadable labels and
 * clipped "Statistics Summit" against the right edge.
 */
export const MAP_LAYOUT_PORTRAIT: MapNode[] = [
  { x: 115, y: 95 },
  { x: 265, y: 245 },
  { x: 115, y: 395 },
  { x: 265, y: 545 },
  { x: 115, y: 695 },
];

const PORTRAIT_QUERY = '(max-width: 640px)';

/**
 * Trims the trail to the number of worlds actually on this grade's map, and
 * shrinks the viewBox to match so a 2-world grade is not mostly empty space.
 */
function fit(
  nodes: MapNode[],
  viewBox: MapViewBox,
  count: number,
  portrait: boolean,
): { nodes: MapNode[]; viewBox: MapViewBox } {
  const used = nodes.slice(0, Math.max(1, Math.min(count, nodes.length)));
  if (used.length === nodes.length) return { nodes: used, viewBox };

  const pad = portrait ? 110 : 90;
  return {
    nodes: used,
    viewBox: portrait
      ? { width: viewBox.width, height: Math.max(...used.map((n) => n.y)) + pad }
      : { width: Math.max(...used.map((n) => n.x)) + pad, height: viewBox.height },
  };
}

/** Picks the trail that fits the viewport, and re-picks on rotate/resize. */
export function useMapLayout(worldCount: number): { nodes: MapNode[]; viewBox: MapViewBox } {
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
    ? fit(MAP_LAYOUT_PORTRAIT, MAP_VIEWBOX_PORTRAIT, worldCount, true)
    : fit(MAP_LAYOUT, MAP_VIEWBOX, worldCount, false);
}

/** Position of a world on the current map, by its index in that grade's list. */
export function getNodePosition(worldIndex: number, nodes: MapNode[]): MapNode {
  return nodes[Math.max(0, Math.min(worldIndex, nodes.length - 1))] ?? nodes[0];
}
