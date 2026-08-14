import { useRef, useState } from 'react';
import type { GraphPlotQuestion, GridPoint } from '../../types/game';
import type { UserAnswer } from '../../lib/scoring';
import { Button } from '../shared/Button';
import './GraphPlotAnswer.css';

interface GraphPlotAnswerProps {
  question: GraphPlotQuestion;
  onAnswer: (answer: UserAnswer) => void;
  disabled: boolean;
}

const PADDING = 24;
const SIZE = 320;

export function GraphPlotAnswer({ question, onAnswer, disabled }: GraphPlotAnswerProps) {
  const { xMin, xMax, yMin, yMax } = question.bounds;
  const targetCount = question.mode.kind === 'line' ? 2 : question.mode.count;

  const [points, setPoints] = useState<GridPoint[]>([]);
  const [cursor, setCursor] = useState<GridPoint>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const plotWidth = SIZE - PADDING * 2;
  const plotHeight = SIZE - PADDING * 2;
  const toSvgX = (x: number) => PADDING + ((x - xMin) / (xMax - xMin)) * plotWidth;
  // SVG y grows downward; the maths convention is upward.
  const toSvgY = (y: number) => PADDING + ((yMax - y) / (yMax - yMin)) * plotHeight;

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  /** Screen position -> nearest lattice point. */
  const toGrid = (clientX: number, clientY: number): GridPoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    // The SVG scales to its container, so map through the viewBox.
    const sx = ((clientX - rect.left) / rect.width) * SIZE;
    const sy = ((clientY - rect.top) / rect.height) * SIZE;
    const gx = Math.round(xMin + ((sx - PADDING) / plotWidth) * (xMax - xMin));
    const gy = Math.round(yMax - ((sy - PADDING) / plotHeight) * (yMax - yMin));
    return { x: clamp(gx, xMin, xMax), y: clamp(gy, yMin, yMax) };
  };

  const togglePoint = (p: GridPoint) => {
    if (disabled) return;
    setCursor(p);
    setPoints((current) => {
      const existing = current.findIndex((q) => q.x === p.x && q.y === p.y);
      // Tapping a placed point removes it — the natural way to undo a misplace.
      if (existing !== -1) return current.filter((_, i) => i !== existing);
      // At capacity, the oldest point drops off so the kid can keep adjusting
      // rather than having to clear everything.
      return current.length >= targetCount ? [...current.slice(1), p] : [...current, p];
    });
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toGrid(e.clientX, e.clientY);
    if (p) togglePoint(p);
  };

  // Keyboard equivalent: arrows move a cursor, Enter places or removes.
  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (disabled) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      setCursor((c) => ({
        x: clamp(c.x + move[0], xMin, xMax),
        y: clamp(c.y + move[1], yMin, yMax),
      }));
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePoint(cursor);
    }
  };

  const ticks = (min: number, max: number) => {
    const out: number[] = [];
    // Keep the grid readable: at most ~20 lines per axis.
    const step = Math.max(1, Math.ceil((max - min) / 20));
    for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(v);
    return out;
  };

  const line = question.mode.kind === 'line' && points.length === 2 ? extend(points, question.bounds) : null;

  return (
    <div className="graph-plot">
      <svg
        ref={svgRef}
        className="graph-plot__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="application"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Coordinate plane. Arrow keys move the cursor, Enter places a point. ${points.length} of ${targetCount} placed.`}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      >
        <rect x={PADDING} y={PADDING} width={plotWidth} height={plotHeight} className="graph-plot__field" />

        {ticks(xMin, xMax).map((x) => (
          <line key={`vx${x}`} x1={toSvgX(x)} y1={PADDING} x2={toSvgX(x)} y2={SIZE - PADDING} className="graph-plot__grid" />
        ))}
        {ticks(yMin, yMax).map((y) => (
          <line key={`hy${y}`} x1={PADDING} y1={toSvgY(y)} x2={SIZE - PADDING} y2={toSvgY(y)} className="graph-plot__grid" />
        ))}

        {yMin <= 0 && yMax >= 0 && (
          <line x1={PADDING} y1={toSvgY(0)} x2={SIZE - PADDING} y2={toSvgY(0)} className="graph-plot__axis" />
        )}
        {xMin <= 0 && xMax >= 0 && (
          <line x1={toSvgX(0)} y1={PADDING} x2={toSvgX(0)} y2={SIZE - PADDING} className="graph-plot__axis" />
        )}

        {line && (
          <line
            x1={toSvgX(line[0].x)}
            y1={toSvgY(line[0].y)}
            x2={toSvgX(line[1].x)}
            y2={toSvgY(line[1].y)}
            className="graph-plot__line"
          />
        )}

        {!disabled && (
          <circle cx={toSvgX(cursor.x)} cy={toSvgY(cursor.y)} r={7} className="graph-plot__cursor" />
        )}

        {points.map((p) => (
          <circle key={`${p.x},${p.y}`} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={6} className="graph-plot__point" />
        ))}
      </svg>

      <p className="graph-plot__status" role="status">
        {points.length < targetCount
          ? `Tap the grid to place ${targetCount - points.length} more point${targetCount - points.length === 1 ? '' : 's'}.`
          : points.map((p) => `(${p.x}, ${p.y})`).join('  ')}
      </p>

      <div className="graph-plot__actions">
        <Button variant="secondary" onClick={() => setPoints([])} disabled={disabled || points.length === 0}>
          Clear
        </Button>
        <Button
          onClick={() => onAnswer({ type: 'graph-plot', points })}
          disabled={disabled || points.length !== targetCount}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}

/** Stretches the segment through two points out to the edges of the plot. */
function extend(points: GridPoint[], bounds: GraphPlotQuestion['bounds']): [GridPoint, GridPoint] {
  const [a, b] = points;
  if (a.x === b.x) {
    return [
      { x: a.x, y: bounds.yMin },
      { x: a.x, y: bounds.yMax },
    ];
  }
  const slope = (b.y - a.y) / (b.x - a.x);
  const at = (x: number) => ({ x, y: a.y + slope * (x - a.x) });
  return [at(bounds.xMin), at(bounds.xMax)];
}
