"""
AI Traffic Monitoring & Dehazing System - FastAPI Backend
=========================================================
Endpoints:
  POST /api/upload/image   → Process single image
  POST /api/upload/video   → Process video
  GET  /api/stats          → Vehicle analytics
  GET  /api/vehicles       → All tracked vehicles
  GET  /api/overspeed      → Overspeed violations
  GET  /api/analytics      → Full analytics summary
  GET  /api/health         → Health check
"""

import os
import uuid
import time
import json
import shutil
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional

import cv2
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel


# ─────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────

app = FastAPI(
    title="AI Traffic Monitoring System",
    description="Real-time traffic monitoring with dehazing, YOLO detection, and DeepSORT tracking.",
    version="2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# DIRECTORIES
# ─────────────────────────────────────────────

BASE_DIR     = Path(__file__).parent
UPLOAD_DIR   = BASE_DIR / "uploads"
PROCESSED_DIR= BASE_DIR / "processed"
CSV_FILE     = BASE_DIR / "vehicle_speed.csv"

for d in [UPLOAD_DIR, PROCESSED_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Serve processed files as static assets
app.mount("/processed", StaticFiles(directory=str(PROCESSED_DIR)), name="processed")

# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

SPEED_LIMIT     = 60      # km/h
CONF_THRESHOLD  = 0.45
NMS_THRESHOLD   = 0.45
PIXEL_TO_METER  = 0.05    # calibration constant
FPS_DEFAULT     = 30


# ─────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class Detection(BaseModel):
    track_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    speed_kmph: Optional[float] = None
    violation: bool = False
    color: str = "#00FF88"

class ProcessingResult(BaseModel):
    job_id: str
    status: str
    file_type: str
    processed_url: str
    vehicle_count: int
    detections: list[Detection]
    processing_time_ms: float
    timestamp: str
    frame_width: int
    frame_height: int

class AnalyticsResponse(BaseModel):
    total_vehicles: int
    average_speed: float
    max_speed: float
    min_speed: float
    overspeed_count: int
    speed_limit: int
    overspeed_percentage: float
    last_updated: str


# ─────────────────────────────────────────────
# MOCK AI PIPELINE  (swap with real models)
# ─────────────────────────────────────────────
# In production replace `mock_*` with actual:
#   - AOD-Net / PONO dehazing
#   - YOLOv8 detection
#   - DeepSORT tracking

VEHICLE_CLASSES = ["car", "truck", "bus", "motorcycle", "van"]
TRACK_COLORS = {
    "car":        "#00FF88",
    "truck":      "#FF6B35",
    "bus":        "#4ECDC4",
    "motorcycle": "#FFE66D",
    "van":        "#A78BFA",
}


def mock_dehaze(img: np.ndarray) -> np.ndarray:
    """Simulate AOD-Net + PONO dehazing."""
    alpha, beta = 1.08, 15
    enhanced = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)
    gamma = 0.9
    table = np.array([(i / 255.0) ** (1.0 / gamma) * 255 for i in range(256)]).astype("uint8")
    enhanced = cv2.LUT(enhanced, table)
    blur = cv2.GaussianBlur(enhanced, (0, 0), sigmaX=1.0)
    enhanced = cv2.addWeighted(enhanced, 1.15, blur, -0.15, 0)
    return enhanced


def mock_detect_and_track(img: np.ndarray, frame_idx: int = 0) -> list[dict]:
    """Simulate YOLOv8 + DeepSORT detections with realistic randomness seeded by frame."""
    rng = np.random.default_rng(frame_idx + 42)
    h, w = img.shape[:2]
    n_vehicles = int(rng.integers(3, 9))
    detections = []
    used_track_ids = set()

    for _ in range(n_vehicles):
        cls = rng.choice(VEHICLE_CLASSES)
        bw = float(rng.uniform(0.08, 0.20)) * w
        bh = float(rng.uniform(0.06, 0.14)) * h
        bx = float(rng.uniform(0.02, 1.0 - bw / w - 0.02)) * w
        by = float(rng.uniform(0.30, 1.0 - bh / h - 0.02)) * h
        speed = float(rng.uniform(20, 120))
        track_id = int(rng.integers(1, 200))
        while track_id in used_track_ids:
            track_id = int(rng.integers(1, 200))
        used_track_ids.add(track_id)
        conf = float(rng.uniform(0.55, 0.98))
        violation = speed > SPEED_LIMIT
        detections.append({
            "track_id": track_id,
            "class_name": cls,
            "confidence": round(conf, 3),
            "bbox": {"x": round(bx, 1), "y": round(by, 1), "width": round(bw, 1), "height": round(bh, 1)},
            "speed_kmph": round(speed, 1),
            "violation": violation,
            "color": TRACK_COLORS.get(cls, "#FFFFFF"),
        })
    return detections


def draw_detections(img: np.ndarray, detections: list[dict]) -> np.ndarray:
    """Draw bounding boxes, track IDs and speed labels on frame."""
    output = img.copy()
    font = cv2.FONT_HERSHEY_SIMPLEX

    for det in detections:
        b = det["bbox"]
        x, y, w, h = int(b["x"]), int(b["y"]), int(b["width"]), int(b["height"])
        hex_color = det.get("color", "#00FF88").lstrip("#")
        r, g, b_val = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        color = (b_val, g, r)  # BGR

        # Box
        cv2.rectangle(output, (x, y), (x + w, y + h), color, 2)

        # Label background
        label = f"ID:{det['track_id']} {det['class_name']} {det['speed_kmph']}km/h"
        (lw, lh), _ = cv2.getTextSize(label, font, 0.45, 1)
        cv2.rectangle(output, (x, y - lh - 8), (x + lw + 4, y), color, -1)
        cv2.putText(output, label, (x + 2, y - 4), font, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

        # Red border for violations
        if det.get("violation"):
            cv2.rectangle(output, (x - 2, y - 2), (x + w + 2, y + h + 2), (0, 0, 255), 1)

    # Overlay stats
    cv2.rectangle(output, (8, 8), (280, 68), (0, 0, 0), -1)
    cv2.rectangle(output, (8, 8), (280, 68), (0, 255, 136), 1)
    cv2.putText(output, f"Vehicles: {len(detections)}", (16, 30), font, 0.55, (0, 255, 136), 1)
    cv2.putText(output, f"Violations: {sum(1 for d in detections if d['violation'])}", (16, 56), font, 0.55, (0, 80, 255), 1)

    return output


def save_to_csv(detections: list[dict], job_id: str):
    """Append detection results to vehicle_speed.csv."""
    rows = []
    for det in detections:
        rows.append({
            "job_id": job_id,
            "timestamp": datetime.now().isoformat(),
            "track_id": det["track_id"],
            "class": det["class_name"],
            "avg_speed_kmph": det["speed_kmph"],
            "violation": "YES" if det["violation"] else "NO",
            "confidence": det["confidence"],
        })
    new_df = pd.DataFrame(rows)
    if CSV_FILE.exists():
        existing = pd.read_csv(CSV_FILE)
        combined = pd.concat([existing, new_df], ignore_index=True)
    else:
        combined = new_df
    combined.to_csv(CSV_FILE, index=False)


def load_data() -> Optional[pd.DataFrame]:
    if not CSV_FILE.exists():
        return None
    return pd.read_csv(CSV_FILE)


# ─────────────────────────────────────────────
# ROUTES — HEALTH & INFO
# ─────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/system")
def system_info():
    return {
        "dehazing_model": "AOD-Net + PONO",
        "detection_model": "YOLOv8",
        "tracking_model": "DeepSORT",
        "speed_limit_kmph": SPEED_LIMIT,
        "analytics": "FastAPI",
        "dashboard": "React + TypeScript",
    }


# ─────────────────────────────────────────────
# ROUTES — UPLOAD & PROCESS
# ─────────────────────────────────────────────

@app.post("/api/upload/image", response_model=ProcessingResult)
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files are accepted.")

    t0 = time.time()
    job_id = str(uuid.uuid4())[:8]

    # Save upload
    suffix = Path(file.filename).suffix or ".jpg"
    upload_path = UPLOAD_DIR / f"{job_id}_orig{suffix}"
    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Load frame
    img = cv2.imread(str(upload_path))
    if img is None:
        raise HTTPException(422, "Could not decode image.")
    h, w = img.shape[:2]

    # Pipeline
    dehazed   = mock_dehaze(img)
    detections = mock_detect_and_track(dehazed, frame_idx=0)
    output    = draw_detections(dehazed, detections)

    # Save processed
    out_name = f"{job_id}_processed{suffix}"
    out_path = PROCESSED_DIR / out_name
    cv2.imwrite(str(out_path), output)

    # Persist to CSV
    save_to_csv(detections, job_id)

    elapsed_ms = round((time.time() - t0) * 1000, 1)

    return ProcessingResult(
        job_id=job_id,
        status="completed",
        file_type="image",
        processed_url=f"/processed/{out_name}",
        vehicle_count=len(detections),
        detections=[Detection(**d) for d in detections],
        processing_time_ms=elapsed_ms,
        timestamp=datetime.now().isoformat(),
        frame_width=w,
        frame_height=h,
    )


@app.post("/api/upload/video", response_model=ProcessingResult)
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(400, "Only video files are accepted.")

    t0 = time.time()
    job_id = str(uuid.uuid4())[:8]

    suffix = Path(file.filename).suffix or ".mp4"
    upload_path = UPLOAD_DIR / f"{job_id}_orig{suffix}"
    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    cap = cv2.VideoCapture(str(upload_path))
    if not cap.isOpened():
        raise HTTPException(422, "Could not open video file.")

    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps    = cap.get(cv2.CAP_PROP_FPS) or FPS_DEFAULT
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    out_name = f"{job_id}_processed.mp4"
    out_path = PROCESSED_DIR / out_name
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(out_path), fourcc, fps, (width, height))

    all_detections: list[dict] = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        dehazed    = mock_dehaze(frame)
        detections = mock_detect_and_track(dehazed, frame_idx=frame_idx)
        all_detections.extend(detections)
        output_frame = draw_detections(dehazed, detections)
        writer.write(output_frame)
        frame_idx += 1
        # Limit processing to first 300 frames for demo
        if frame_idx >= 300:
            break

    cap.release()
    writer.release()

    # Deduplicate by track_id (keep last seen)
    seen = {}
    for det in all_detections:
        seen[det["track_id"]] = det
    unique_detections = list(seen.values())

    save_to_csv(unique_detections, job_id)
    elapsed_ms = round((time.time() - t0) * 1000, 1)

    return ProcessingResult(
        job_id=job_id,
        status="completed",
        file_type="video",
        processed_url=f"/processed/{out_name}",
        vehicle_count=len(unique_detections),
        detections=[Detection(**d) for d in unique_detections],
        processing_time_ms=elapsed_ms,
        timestamp=datetime.now().isoformat(),
        frame_width=width,
        frame_height=height,
    )


# ─────────────────────────────────────────────
# ROUTES — ANALYTICS
# ─────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    df = load_data()
    if df is None:
        return {"total_vehicles": 0, "average_speed": 0, "max_speed": 0, "min_speed": 0}
    return {
        "total_vehicles": len(df),
        "average_speed": round(float(df["avg_speed_kmph"].mean()), 2),
        "max_speed":     round(float(df["avg_speed_kmph"].max()), 2),
        "min_speed":     round(float(df["avg_speed_kmph"].min()), 2),
    }


@app.get("/api/vehicles")
def get_vehicles():
    df = load_data()
    if df is None:
        return []
    return df.to_dict(orient="records")


@app.get("/api/overspeed")
def get_overspeed():
    df = load_data()
    if df is None:
        return {"speed_limit": SPEED_LIMIT, "overspeed_count": 0, "vehicles": []}
    over = df[df["avg_speed_kmph"] > SPEED_LIMIT]
    return {"speed_limit": SPEED_LIMIT, "overspeed_count": len(over), "vehicles": over.to_dict(orient="records")}


@app.get("/api/analytics", response_model=AnalyticsResponse)
def analytics():
    df = load_data()
    if df is None:
        return AnalyticsResponse(
            total_vehicles=0, average_speed=0, max_speed=0, min_speed=0,
            overspeed_count=0, speed_limit=SPEED_LIMIT, overspeed_percentage=0.0,
            last_updated=datetime.now().isoformat(),
        )
    total = len(df)
    over  = len(df[df["avg_speed_kmph"] > SPEED_LIMIT])
    return AnalyticsResponse(
        total_vehicles=total,
        average_speed=round(float(df["avg_speed_kmph"].mean()), 2),
        max_speed=round(float(df["avg_speed_kmph"].max()), 2),
        min_speed=round(float(df["avg_speed_kmph"].min()), 2),
        overspeed_count=over,
        speed_limit=SPEED_LIMIT,
        overspeed_percentage=round((over / total) * 100 if total else 0, 2),
        last_updated=datetime.now().isoformat(),
    )


@app.get("/api/violations")
def violations():
    df = load_data()
    if df is None:
        return {"count": 0, "vehicles": []}
    vdf = df[df["violation"] == "YES"]
    return {"count": len(vdf), "vehicles": vdf.to_dict(orient="records")}


@app.get("/api/debug")
def debug():
    return {
        "cwd": str(BASE_DIR),
        "uploads": os.listdir(str(UPLOAD_DIR)),
        "processed": os.listdir(str(PROCESSED_DIR)),
        "csv_exists": CSV_FILE.exists(),
    }
