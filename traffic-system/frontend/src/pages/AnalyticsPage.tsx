import React from "react";
import { useAnalytics, useOverspeed, useVehicles } from "../hooks/useTraffic";
import StatCard from "../components/StatCard";

const VehicleClassBar: React.FC<{ vehicles: any[] }> = ({ vehicles }) => {
  const counts: Record<string, number> = {};
  vehicles.forEach((v) => { counts[v.class] = (counts[v.class] ?? 0) + 1; });
  const total = vehicles.length || 1;
  const colors: Record<string, string> = {
    car: "#00FF88", truck: "#FF6B35", bus: "#4ECDC4", motorcycle: "#FFE66D", van: "#A78BFA",
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 12, letterSpacing: "0.1em" }}>
        VEHICLE CLASS BREAKDOWN
      </div>
      {Object.entries(counts).map(([cls, count]) => (
        <div key={cls} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "#aaa" }}>
            <span>{cls}</span>
            <span style={{ fontFamily: "monospace", color: colors[cls] ?? "#fff" }}>{count}</span>
          </div>
          <div style={{ height: 6, background: "#111", borderRadius: 99 }}>
            <div style={{
              width: `${(count / total) * 100}%`,
              height: "100%",
              background: colors[cls] ?? "#666",
              borderRadius: 99,
              transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const SpeedGauge: React.FC<{ speed: number; max?: number }> = ({ speed, max = 140 }) => {
  const angle = (speed / max) * 180 - 90;
  const r = 60;
  const cx = 80, cy = 80;
  const rad = (a: number) => (a * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad(angle - 90));
  const ny = cy + r * Math.sin(rad(angle - 90));
  const safeAng = (60 / max) * 180;

  return (
    <svg viewBox="0 0 160 120" style={{ width: "100%", maxWidth: 180 }}>
      {/* Arc background */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1e1e1e" strokeWidth={8} strokeLinecap="round"
      />
      {/* Safe zone */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(rad(safeAng - 90))} ${cy + r * Math.sin(rad(safeAng - 90))}`}
        fill="none" stroke="#00FF8844" strokeWidth={8} strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={cx + (r - 10) * Math.cos(rad(angle - 90))}
        y2={cy + (r - 10) * Math.sin(rad(angle - 90))}
        stroke={speed > 60 ? "#FF2D55" : "#00FF88"}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill="#fff" />
      <text x={cx} y={cy + 22} textAnchor="middle" fill={speed > 60 ? "#FF2D55" : "#00FF88"}
        fontSize={18} fontFamily="'Space Mono', monospace" fontWeight={700}>
        {speed}
      </text>
      <text x={cx} y={cy + 34} textAnchor="middle" fill="#555" fontSize={9} fontFamily="monospace">
        km/h avg
      </text>
      <text x={cx - r + 4} y={cy + 14} fill="#444" fontSize={8}>0</text>
      <text x={cx + r - 12} y={cy + 14} fill="#444" fontSize={8}>{max}</text>
    </svg>
  );
};

const AnalyticsPage: React.FC = () => {
  const { data, loading, error, refresh } = useAnalytics(15_000);
  const { data: overspeedData } = useOverspeed();
  const { vehicles } = useVehicles();

  if (loading) return (
    <div style={{ padding: 64, textAlign: "center", color: "#444" }}>
      <div style={{ fontSize: 13, letterSpacing: "0.1em" }}>LOADING ANALYTICS...</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, color: "#FF2D55", textAlign: "center" }}>
      <div>⚠ {error}</div>
      <button onClick={refresh} style={{ marginTop: 16, padding: "8px 20px", background: "transparent", border: "1px solid #FF2D55", color: "#FF2D55", borderRadius: 8, cursor: "pointer" }}>
        Retry
      </button>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 64, textAlign: "center", color: "#444" }}>
      <div style={{ fontSize: 13 }}>No data yet. Upload an image or video to get started.</div>
    </div>
  );

  return (
    <div style={{ padding: "32px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 600 }}>Traffic Analytics</h2>
          <div style={{ fontSize: 11, color: "#555", marginTop: 4, fontFamily: "monospace" }}>
            Last updated {new Date(data.last_updated).toLocaleTimeString()}
          </div>
        </div>
        <button
          onClick={refresh}
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            color: "#888",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Vehicles" value={data.total_vehicles} icon="🚗" accent="#00FF88" pulse />
        <StatCard label="Avg Speed" value={`${data.average_speed}`} sub="km/h" icon="⚡" accent="#4ECDC4" />
        <StatCard label="Max Speed" value={`${data.max_speed}`} sub="km/h" icon="🚀" accent="#FF6B35" />
        <StatCard label="Violations" value={data.overspeed_count} icon="⚠" accent="#FF2D55" />
        <StatCard label="Violation Rate" value={`${data.overspeed_percentage}%`} icon="📊" accent="#FFB800" />
        <StatCard label="Speed Limit" value={`${data.speed_limit}`} sub="km/h" icon="🛑" accent="#A78BFA" />
      </div>

      {/* Mid row: Gauge + Class breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid #1e1e1e",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12, letterSpacing: "0.1em", alignSelf: "flex-start" }}>
            AVG SPEED GAUGE
          </div>
          <SpeedGauge speed={data.average_speed} />
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e1e1e", borderRadius: 12, padding: 20 }}>
          <VehicleClassBar vehicles={vehicles} />
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e1e1e", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 16, letterSpacing: "0.1em" }}>
            COMPLIANCE
          </div>
          {/* Donut chart */}
          {(() => {
            const total = data.total_vehicles || 1;
            const violPct = data.overspeed_count / total;
            const safePct = 1 - violPct;
            const r = 44, cx = 70, cy = 70;
            const circ = 2 * Math.PI * r;
            const safeDash = safePct * circ;
            const violDash = violPct * circ;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <svg viewBox="0 0 140 140" style={{ width: 120, flexShrink: 0 }}>
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a1a" strokeWidth={14} />
                  <circle
                    cx={cx} cy={cy} r={r} fill="none"
                    stroke="#00FF88" strokeWidth={14}
                    strokeDasharray={`${safeDash} ${circ}`}
                    strokeDashoffset={circ / 4}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={cx} cy={cy} r={r} fill="none"
                    stroke="#FF2D55" strokeWidth={14}
                    strokeDasharray={`${violDash} ${circ}`}
                    strokeDashoffset={circ / 4 - safeDash}
                    strokeLinecap="round"
                    opacity={0.8}
                  />
                  <text x={cx} y={cy + 5} textAnchor="middle" fill="#fff"
                    fontSize={16} fontFamily="'Space Mono', monospace" fontWeight={700}>
                    {Math.round(safePct * 100)}%
                  </text>
                  <text x={cx} y={cy + 18} textAnchor="middle" fill="#555" fontSize={8}>
                    compliant
                  </text>
                </svg>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "#00FF88" }} />
                    <span style={{ fontSize: 12, color: "#aaa" }}>Safe</span>
                    <span style={{ fontSize: 12, color: "#00FF88", fontFamily: "monospace", marginLeft: "auto" }}>
                      {data.total_vehicles - data.overspeed_count}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "#FF2D55" }} />
                    <span style={{ fontSize: 12, color: "#aaa" }}>Violation</span>
                    <span style={{ fontSize: 12, color: "#FF2D55", fontFamily: "monospace", marginLeft: "auto" }}>
                      {data.overspeed_count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Violations table */}
      {overspeedData && overspeedData.vehicles.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #FF2D5533", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: "#FF2D55", marginBottom: 12, letterSpacing: "0.1em" }}>
            ⚠ OVERSPEED VIOLATIONS — {overspeedData.overspeed_count} CASES
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                  {["Track ID", "Class", "Speed", "Confidence", "Time"].map((h) => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#555", letterSpacing: "0.1em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overspeedData.vehicles.slice(0, 20).map((v: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #111" }}>
                    <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#FF6B88", fontSize: 12 }}>
                      #{String(v.track_id).padStart(3, "0")}
                    </td>
                    <td style={{ padding: "9px 14px", color: "#aaa" }}>{v.class}</td>
                    <td style={{ padding: "9px 14px", color: "#FF2D55", fontFamily: "monospace", fontWeight: 700 }}>
                      {v.avg_speed_kmph} km/h
                    </td>
                    <td style={{ padding: "9px 14px", color: "#666" }}>
                      {Math.round((v.confidence ?? 0) * 100)}%
                    </td>
                    <td style={{ padding: "9px 14px", color: "#555", fontSize: 11 }}>
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
