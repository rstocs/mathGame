import type { VisualHint as VisualHintType } from '../../types/game';
import './VisualHint.css';

interface VisualHintProps {
  hint: VisualHintType;
}

export function VisualHint({ hint }: VisualHintProps) {
  return (
    <div className="visual-hint">
      <VisualHintSvg hint={hint} />
    </div>
  );
}

function VisualHintSvg({ hint }: { hint: VisualHintType }) {
  switch (hint.kind) {
    case 'circle':
      return (
        <svg viewBox="0 0 160 140" width="160" height="140">
          <circle cx="80" cy="70" r="55" fill="none" stroke="var(--world-primary, #1e88e5)" strokeWidth="4" />
          <line x1="80" y1="70" x2="135" y2="70" stroke="var(--world-accent, #0d47a1)" strokeWidth="3" strokeDasharray="4 3" />
          <circle cx="80" cy="70" r="3" fill="var(--world-accent, #0d47a1)" />
          <text x="105" y="64" fontSize="13" fill="var(--color-ink)" fontWeight="700">
            {hint.radiusLabel}
          </text>
        </svg>
      );
    case 'rectangle':
      return (
        <svg viewBox="0 0 180 130" width="180" height="130">
          <rect x="25" y="20" width="130" height="80" fill="none" stroke="var(--world-primary, #2ecc71)" strokeWidth="4" rx="4" />
          <text x="90" y="115" fontSize="13" fill="var(--color-ink)" fontWeight="700" textAnchor="middle">
            {hint.widthLabel}
          </text>
          <text x="14" y="65" fontSize="13" fill="var(--color-ink)" fontWeight="700" textAnchor="middle" transform="rotate(-90 14 65)">
            {hint.heightLabel}
          </text>
        </svg>
      );
    case 'number-line': {
      const { from, to, markAt } = hint;
      const width = 260;
      const margin = 20;
      const span = to - from;
      const toX = (v: number) => margin + ((v - from) / span) * (width - margin * 2);
      const ticks = Array.from({ length: to - from + 1 }, (_, i) => from + i);
      return (
        <svg viewBox={`0 0 ${width} 70`} width={width} height="70">
          <line x1={margin} y1="35" x2={width - margin} y2="35" stroke="var(--color-ink-soft)" strokeWidth="2" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={toX(t)} y1="28" x2={toX(t)} y2="42" stroke="var(--color-ink-soft)" strokeWidth="2" />
              <text x={toX(t)} y="58" fontSize="11" textAnchor="middle" fill="var(--color-ink-soft)">
                {t}
              </text>
            </g>
          ))}
          {markAt !== undefined && (
            <circle cx={toX(markAt)} cy="35" r="7" fill="var(--world-primary, #e8752c)" />
          )}
        </svg>
      );
    }
    case 'fraction-bars': {
      const { numerator, denominator } = hint;
      const width = 220;
      const segWidth = width / denominator;
      return (
        <svg viewBox={`0 0 ${width} 50`} width={width} height="50">
          {Array.from({ length: denominator }, (_, i) => (
            <rect
              key={i}
              x={i * segWidth}
              y="5"
              width={segWidth - 2}
              height="40"
              fill={i < numerator ? 'var(--world-primary, #8e5ce8)' : 'white'}
              stroke="var(--color-ink-soft)"
              strokeWidth="2"
              rx="3"
            />
          ))}
        </svg>
      );
    }
    case 'bar-chart': {
      const { data } = hint;
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const barWidth = 40;
      const gap = 16;
      const chartHeight = 100;
      const width = data.length * (barWidth + gap);
      return (
        <svg viewBox={`0 0 ${width} 140`} width={width} height="140">
          {data.map((d, i) => {
            const h = (d.value / maxVal) * chartHeight;
            const x = i * (barWidth + gap);
            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={chartHeight - h + 10}
                  width={barWidth}
                  height={h}
                  fill="var(--world-primary, #3d4d8c)"
                  rx="4"
                />
                <text x={x + barWidth / 2} y={chartHeight - h - 2} fontSize="11" textAnchor="middle" fill="var(--color-ink)" fontWeight="700">
                  {d.value}
                </text>
                <text x={x + barWidth / 2} y="130" fontSize="11" textAnchor="middle" fill="var(--color-ink-soft)">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }
  }
}
