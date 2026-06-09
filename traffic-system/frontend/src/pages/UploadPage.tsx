import React, { useCallback, useRef, useState } from "react";
import { uploadImage, uploadVideo, getMediaUrl } from "../services/api";
import { useUpload } from "../hooks/useTraffic";
import BoundingBoxOverlay from "../components/BoundingBoxOverlay";
import DetectionTable from "../components/DetectionTable";
import StatCard from "../components/StatCard";
import SpeedChart from "../components/SpeedChart";

type Mode = "image" | "video";

const UploadPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("image");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const imgUpload = useUpload(uploadImage);
  const vidUpload = useUpload(uploadVideo);
  const { status, progress, result, error, upload, reset, file } =
    mode === "image" ? imgUpload : vidUpload;

  const handleFile = (f: File) => {
    if (mode === "image" && !f.type.startsWith("image/")) return alert("Please select an image file.");
    if (mode === "video" && !f.type.startsWith("video/")) return alert("Please select a video file.");
    upload(f);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [mode]
  );

  const violations = result?.detections.filter((d) => d.violation).length ?? 0;
  const avgSpeed = result
    ? (result.detections.reduce((s, d) => s + (d.speed_kmph ?? 0), 0) / result.detections.length).toFixed(1)
    : "—";

  return (
    <div style={{ padding: "32px 0" }}>
      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {(["image", "video"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset(); }}
            style={{
              padding: "8px 24px",
              borderRadius: 8,
              border: `1px solid ${mode === m ? "#00FF88" : "#333"}`,
              background: mode === m ? "#00FF8818" : "transparent",
              color: mode === m ? "#00FF88" : "#666",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.08em",
              transition: "all 0.2s",
            }}
          >
            {m === "image" ? "🖼 IMAGE" : "🎬 VIDEO"}
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      {status === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `2px dashed ${dragging ? "#00FF88" : "#333"}`,
            borderRadius: 16,
            padding: "64px 32px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "#00FF8808" : "rgba(255,255,255,0.02)",
            transition: "all 0.3s",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>{mode === "image" ? "🖼" : "🎬"}</div>
          <div style={{ fontSize: 16, color: "#ccc", marginBottom: 8 }}>
            Drop {mode} here or click to browse
          </div>
          <div style={{ fontSize: 12, color: "#555" }}>
            {mode === "image" ? "JPG, PNG, WEBP supported" : "MP4, AVI, MOV supported"}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={mode === "image" ? "image/*" : "video/*"}
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* Progress */}
      {(status === "uploading" || status === "processing") && (
        <div style={{
          border: "1px solid #00FF8833",
          borderRadius: 16,
          padding: "48px 32px",
          textAlign: "center",
          background: "#00FF8806",
        }}>
          <div style={{ fontSize: 13, color: "#00FF88", marginBottom: 24, letterSpacing: "0.1em" }}>
            {status === "uploading" ? "⬆ UPLOADING..." : "⚙ PROCESSING WITH AI PIPELINE..."}
          </div>

          {/* Pipeline stages */}
          <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 28, flexWrap: "wrap" }}>
            {["Dehazing (AOD-Net)", "Detection (YOLOv8)", "Tracking (DeepSORT)", "Analytics"].map((stage, i) => (
              <React.Fragment key={stage}>
                <div style={{
                  fontSize: 11,
                  color: status === "processing" && i <= Math.floor((progress / 100) * 3) ? "#00FF88" : "#444",
                  padding: "4px 12px",
                  borderRadius: 4,
                  border: `1px solid ${status === "processing" && i <= Math.floor((progress / 100) * 3) ? "#00FF8844" : "#222"}`,
                  transition: "all 0.5s",
                }}>
                  {stage}
                </div>
                {i < 3 && <span style={{ color: "#333", alignSelf: "center", padding: "0 4px" }}>→</span>}
              </React.Fragment>
            ))}
          </div>

          <div style={{ background: "#111", borderRadius: 99, height: 6, overflow: "hidden", maxWidth: 400, margin: "0 auto 12px" }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #00FF88, #4ECDC4)",
              transition: "width 0.3s",
              borderRadius: 99,
            }} />
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>{progress}%</div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{
          border: "1px solid #FF2D5566",
          borderRadius: 16,
          padding: 24,
          background: "#FF2D5511",
          color: "#FF2D55",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠ Processing Failed</div>
          <div style={{ fontSize: 13, color: "#ff8899" }}>{error}</div>
          <button onClick={reset} style={{
            marginTop: 16,
            padding: "8px 20px",
            borderRadius: 8,
            border: "1px solid #FF2D5566",
            background: "transparent",
            color: "#FF2D55",
            cursor: "pointer",
          }}>
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {status === "done" && result && (
        <div>
          {/* Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
            <StatCard label="Vehicles" value={result.vehicle_count} icon="🚗" accent="#00FF88" />
            <StatCard label="Violations" value={violations} icon="⚠" accent={violations > 0 ? "#FF2D55" : "#00FF88"} />
            <StatCard label="Avg Speed" value={`${avgSpeed}`} sub="km/h" accent="#4ECDC4" icon="⚡" />
            <StatCard label="Proc. Time" value={`${result.processing_time_ms}ms`} accent="#A78BFA" icon="⏱" />
          </div>

          {/* Image result with bounding boxes */}
          {result.file_type === "image" && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 10, letterSpacing: "0.1em" }}>
                PROCESSED OUTPUT — DETECTIONS OVERLAID
              </div>
              <BoundingBoxOverlay
                result={result}
                imageUrl={getMediaUrl(result.processed_url)}
              />
            </div>
          )}

          {/* Video result */}
          {result.file_type === "video" && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 10, letterSpacing: "0.1em" }}>
                PROCESSED VIDEO
              </div>
              <video
                controls
                style={{ width: "100%", borderRadius: 8, background: "#000" }}
                src={getMediaUrl(result.processed_url)}
              />
            </div>
          )}

          {/* Speed Chart + Detection Table */}
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, marginBottom: 28 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e1e1e", borderRadius: 12, padding: 20 }}>
              <SpeedChart detections={result.detections} />
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e1e1e", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 12, letterSpacing: "0.1em" }}>
                TRACKED VEHICLES — {result.vehicle_count} DETECTED
              </div>
              <DetectionTable detections={result.detections} />
            </div>
          </div>

          {/* Job Meta */}
          <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace", borderTop: "1px solid #1a1a1a", paddingTop: 12 }}>
            JOB: {result.job_id} • {new Date(result.timestamp).toLocaleString()} • {result.frame_width}×{result.frame_height}
          </div>

          <button onClick={reset} style={{
            marginTop: 16,
            padding: "10px 28px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "transparent",
            color: "#888",
            cursor: "pointer",
            fontSize: 13,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#00FF88"; (e.currentTarget as HTMLElement).style.color = "#00FF88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#333"; (e.currentTarget as HTMLElement).style.color = "#888"; }}
          >
            ↺ Process Another
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
