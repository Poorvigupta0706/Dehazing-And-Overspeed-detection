import React, { useState } from "react";
import type { Detection } from "../types/api";

interface Props {
  detections: Detection[];
}

const CLASS_EMOJI: Record<string, string> = {
  car: "🚗",
  truck: "🚛",
  bus: "🚌",
  motorcycle: "🏍",
  van: "🚐",
};

const DetectionTable: React.FC<Props> = ({ detections }) => {
  const [sortKey, setSortKey] = useState<keyof Detection>("track_id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<"all" | "violation">("all");

  const handleSort = (key: keyof Detection) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...detections]
    .filter((d) => filter === "all" || d.violation)
    .sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const Th: React.FC<{ col: keyof Detection; label: string }> = ({ col, label }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: "10px 14px",
        textAlign: "left",
        fontSize: 11,
        letterSpacing: "0.1em",
        color: sortKey === col ? "#00FF88" : "#666",
        cursor: "pointer",
        userSelect: "none",
        borderBottom: "1px solid #222",
        whiteSpace: "nowrap",
      }}
    >
      {label} {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div>
      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["all", "violation"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "5px 14px",
              borderRadius: 6,
              border: `1px solid ${filter === f ? "#00FF88" : "#333"}`,
              background: filter === f ? "#00FF8822" : "transparent",
              color: filter === f ? "#00FF88" : "#666",
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {f === "all" ? `All (${detections.length})` : `Violations (${detections.filter((d) => d.violation).length})`}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #1e1e1e" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#0d0d0d" }}>
            <tr>
              <Th col="track_id" label="TRACK ID" />
              <Th col="class_name" label="TYPE" />
              <Th col="speed_kmph" label="SPEED" />
              <Th col="confidence" label="CONF" />
              <Th col="violation" label="STATUS" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((det, i) => (
              <tr
                key={det.track_id}
                style={{
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  borderBottom: "1px solid #111",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff08"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}
              >
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    color: det.color,
                    fontSize: 12,
                    fontWeight: 700,
                  }}>
                    #{String(det.track_id).padStart(3, "0")}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "#ccc" }}>
                  {CLASS_EMOJI[det.class_name] ?? "🚙"} {det.class_name}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    color: det.violation ? "#FF2D55" : det.speed_kmph && det.speed_kmph > 50 ? "#FFB800" : "#00FF88",
                    fontWeight: 600,
                  }}>
                    {det.speed_kmph ?? "—"} km/h
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "#888" }}>
                  {Math.round((det.confidence ?? 0) * 100)}%
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {det.violation ? (
                    <span style={{
                      background: "#FF2D5522",
                      border: "1px solid #FF2D5566",
                      color: "#FF2D55",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}>
                      ⚠ VIOLATION
                    </span>
                  ) : (
                    <span style={{
                      background: "#00FF8811",
                      border: "1px solid #00FF8833",
                      color: "#00FF88",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 11,
                      letterSpacing: "0.05em",
                    }}>
                      ✓ CLEAR
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#444" }}>
                  No detections found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DetectionTable;
