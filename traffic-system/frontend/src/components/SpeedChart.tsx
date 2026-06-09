import React, { useMemo } from "react";
import type { Detection } from "../types/api";

interface Props {
  detections: Detection[];
}

const BUCKETS = [
  { label: "0–30", min: 0,  max: 30,  color: "#00FF88" },
  { label: "30–60", min: 30, max: 60, color: "#4ECDC4" },
  { label: "60–80", min: 60, max: 80, color: "#FFB800" },
  { label: "80–100", min: 80, max: 100, color: "#FF6B35" },
  { label: "100+",  min: 100, max: Infinity, color: "#FF2D55" },
];

const SpeedChart: React.FC<Props> = ({ detections }) => {
  const buckets = useMemo(() => {
    const counts = BUCKETS.map((b) => ({
      ...b,
      count: detections.filter(
        (d) => d.speed_kmph !== null && d.speed_kmph >= b.min && d.speed_kmph < b.max
      ).length,
    }));
    const max = Math.max(...counts.map((b) => b.count), 1);
    return counts.map((b) => ({ ...b, pct: b.count / max }));
  }, [detections]);

  const chartH = 120;
  const barW = 40;
  const gap = 16;
  const totalW = BUCKETS.length * (barW + gap) - gap;

  return (
    <div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 12, letterSpacing: "0.08em" }}>
        SPEED DISTRIBUTION
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${totalW + 20} ${chartH + 36}`}
        style={{ overflow: "visible" }}
      >
        {buckets.map((b, i) => {
          const x = i * (barW + gap);
          const barH = Math.max(b.pct * chartH, 2);
          const y = chartH - barH;
          return (
            <g key={b.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={b.color}
                opacity={0.2}
                rx={4}
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={4}
                fill={b.color}
                rx={2}
              />
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fill={b.color}
                fontSize={11}
                fontFamily="'Space Mono', monospace"
                fontWeight={700}
              >
                {b.count}
              </text>
              <text
                x={x + barW / 2}
                y={chartH + 18}
                textAnchor="middle"
                fill="#666"
                fontSize={10}
                fontFamily="monospace"
              >
                {b.label}
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={0} y1={chartH} x2={totalW} y2={chartH} stroke="#222" strokeWidth={1} />
        {/* Speed limit marker */}
        <line
          x1={barW + gap}
          y1={0}
          x2={barW + gap}
          y2={chartH}
          stroke="#FF2D55"
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.6}
        />
        <text x={barW + gap + 4} y={10} fill="#FF2D55" fontSize={9} fontFamily="monospace">
          limit
        </text>
      </svg>
    </div>
  );
};

export default SpeedChart;
