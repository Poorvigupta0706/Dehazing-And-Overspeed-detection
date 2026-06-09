// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  track_id: number;
  class_name: VehicleClass;
  confidence: number;
  bbox: BoundingBox;
  speed_kmph: number | null;
  violation: boolean;
  color: string;
}

export type VehicleClass = "car" | "truck" | "bus" | "motorcycle" | "van";

export interface ProcessingResult {
  job_id: string;
  status: "completed" | "processing" | "failed";
  file_type: "image" | "video";
  processed_url: string;
  vehicle_count: number;
  detections: Detection[];
  processing_time_ms: number;
  timestamp: string;
  frame_width: number;
  frame_height: number;
}

export interface AnalyticsData {
  total_vehicles: number;
  average_speed: number;
  max_speed: number;
  min_speed: number;
  overspeed_count: number;
  speed_limit: number;
  overspeed_percentage: number;
  last_updated: string;
}

export interface VehicleRecord {
  job_id: string;
  timestamp: string;
  track_id: number;
  class: VehicleClass;
  avg_speed_kmph: number;
  violation: "YES" | "NO";
  confidence: number;
}

export interface OverspeedResponse {
  speed_limit: number;
  overspeed_count: number;
  vehicles: VehicleRecord[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface SystemInfo {
  dehazing_model: string;
  detection_model: string;
  tracking_model: string;
  speed_limit_kmph: number;
  analytics: string;
  dashboard: string;
}

// ─────────────────────────────────────────────
// Upload State Types
// ─────────────────────────────────────────────

export type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

export interface UploadState {
  status: UploadStatus;
  progress: number;
  result: ProcessingResult | null;
  error: string | null;
  file: File | null;
}

// ─────────────────────────────────────────────
// Chart / UI Types
// ─────────────────────────────────────────────

export interface SpeedBucket {
  range: string;
  count: number;
  fill: string;
}

export interface ClassDistribution {
  name: string;
  value: number;
  color: string;
}
