import React from "react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}

const StatCard: React.FC<Props> = ({
  label,
  value,
  sub,
  accent = "#00FF88",
  icon,
  pulse = false,
}) => (
  <div
    style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${accent}33`,
      borderRadius: 12,
      padding: "20px 24px",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.3s",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = accent + "99";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = accent + "33";
    }}
  >
    {/* Corner accent */}
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 48,
        height: 48,
        background: `radial-gradient(circle at top right, ${accent}22, transparent 70%)`,
      }}
    />

    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 11, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </span>
      {icon && (
        <span style={{ fontSize: 18, opacity: 0.8 }}>{icon}</span>
      )}
    </div>

    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      {pulse && (
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: accent,
            animation: "pulse 1.5s infinite",
            flexShrink: 0,
            marginBottom: 4,
          }}
        />
      )}
      <span
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: accent,
          fontFamily: "'Space Mono', monospace",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>

    {sub && (
      <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        {sub}
      </div>
    )}
  </div>
);

export default StatCard;
