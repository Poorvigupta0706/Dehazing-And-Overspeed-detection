import React, { useState } from "react";
import UploadPage from "./pages/UploadPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { useApiStatus } from "./hooks/useTraffic";

type Page = "upload" | "analytics";

const NavItem: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 16px",
      borderRadius: 8,
      border: "none",
      background: active ? "rgba(0,255,136,0.1)" : "transparent",
      color: active ? "#00FF88" : "#666",
      cursor: "pointer",
      width: "100%",
      textAlign: "left",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      transition: "all 0.2s",
      letterSpacing: active ? "0.04em" : "0",
    }}
    onMouseEnter={(e) => {
      if (!active) (e.currentTarget as HTMLElement).style.color = "#aaa";
    }}
    onMouseLeave={(e) => {
      if (!active) (e.currentTarget as HTMLElement).style.color = "#666";
    }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    {label}
    {active && (
      <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#00FF88" }} />
    )}
  </button>
);

const App: React.FC = () => {
  const [page, setPage] = useState<Page>("upload");
  const apiOnline = useApiStatus();

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#080808",
      color: "#e0e0e0",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>

      {/* Sidebar */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: "#0c0c0c",
        borderRight: "1px solid #161616",
        display: "flex",
        flexDirection: "column",
        padding: "24px 12px",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 36, padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #00FF88, #4ECDC4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}>
              🚦
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>TrafficAI</div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.08em" }}>v2.0</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.12em", padding: "0 16px", marginBottom: 8 }}>
            MODULES
          </div>
          <NavItem active={page === "upload"} onClick={() => setPage("upload")} icon="⬆" label="Process Media" />
          <NavItem active={page === "analytics"} onClick={() => setPage("analytics")} icon="📊" label="Analytics" />
        </nav>

        {/* API Status */}
        <div style={{
          padding: "12px 16px",
          borderRadius: 8,
          background: apiOnline === null ? "#111" : apiOnline ? "#00FF8811" : "#FF2D5511",
          border: `1px solid ${apiOnline === null ? "#1e1e1e" : apiOnline ? "#00FF8833" : "#FF2D5533"}`,
          fontSize: 11,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: apiOnline === null ? "#444" : apiOnline ? "#00FF88" : "#FF2D55",
              animation: apiOnline ? "pulse 1.5s infinite" : "none",
            }} />
            <span style={{ color: apiOnline === null ? "#444" : apiOnline ? "#00FF88" : "#FF2D55" }}>
              {apiOnline === null ? "Connecting..." : apiOnline ? "API Online" : "API Offline"}
            </span>
          </div>
          <div style={{ color: "#444", fontSize: 10, marginTop: 4 }}>localhost:8000</div>
        </div>

        {/* Stack badges */}
        <div style={{ marginTop: 16, padding: "0 4px" }}>
          {["AOD-Net + PONO", "YOLOv8", "DeepSORT"].map((tech) => (
            <div key={tech} style={{
              fontSize: 10,
              color: "#444",
              padding: "3px 8px",
              marginBottom: 4,
              borderRadius: 4,
              border: "1px solid #1a1a1a",
              fontFamily: "monospace",
            }}>
              {tech}
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        {/* Top bar */}
        <header style={{
          padding: "16px 32px",
          borderBottom: "1px solid #111",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "#08080888",
          backdropFilter: "blur(12px)",
          zIndex: 10,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>
              {page === "upload" ? "Process Media" : "Analytics Dashboard"}
            </h1>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2, fontFamily: "monospace" }}>
              {page === "upload"
                ? "Upload images or videos for AI-powered traffic analysis"
                : "Real-time vehicle detection & speed monitoring metrics"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{
              padding: "5px 12px",
              borderRadius: 6,
              background: "#00FF8811",
              border: "1px solid #00FF8833",
              fontSize: 11,
              color: "#00FF88",
              fontFamily: "monospace",
            }}>
              LIVE
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: "0 32px", maxWidth: 1200, margin: "0 auto" }}>
          {page === "upload" && <UploadPage />}
          {page === "analytics" && <AnalyticsPage />}
        </div>
      </main>

      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 99px; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default App;
