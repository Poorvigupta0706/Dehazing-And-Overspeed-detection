import React, { useRef, useEffect } from "react";
import type { Detection, ProcessingResult } from "../types/api";

interface Props {
  result: ProcessingResult;
  imageUrl: string;
}

const CLASS_ICONS: Record<string, string> = {
  car: "🚗",
  truck: "🚛",
  bus: "🚌",
  motorcycle: "🏍",
  van: "🚐",
};

const BoundingBoxOverlay: React.FC<Props> = ({ result, imageUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const scale = Math.min(
        container.clientWidth / result.frame_width,
        container.clientHeight / result.frame_height
      );
      canvas.width = result.frame_width * scale;
      canvas.height = result.frame_height * scale;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      result.detections.forEach((det) => {
        const { x, y, width, height } = det.bbox;
        const sx = x * scale;
        const sy = y * scale;
        const sw = width * scale;
        const sh = height * scale;

        // Box glow
        ctx.shadowColor = det.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = det.violation ? "#FF2D55" : det.color;
        ctx.lineWidth = det.violation ? 2.5 : 2;
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.shadowBlur = 0;

        // Label pill
        const label = `ID:${det.track_id} ${det.class_name} ${det.speed_kmph}km/h`;
        ctx.font = "bold 11px 'Courier New', monospace";
        const tw = ctx.measureText(label).width;
        const ph = 18;
        const pw = tw + 10;

        ctx.fillStyle = det.violation ? "#FF2D5599" : "#00000099";
        ctx.beginPath();
        ctx.roundRect(sx, sy - ph - 2, pw, ph, 4);
        ctx.fill();

        ctx.fillStyle = det.violation ? "#FFAAAA" : det.color;
        ctx.fillText(label, sx + 5, sy - 7);
      });
    };
  }, [result, imageUrl]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", background: "#000", borderRadius: 8 }}
    >
      <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%", borderRadius: 8 }} />
    </div>
  );
};

export default BoundingBoxOverlay;
