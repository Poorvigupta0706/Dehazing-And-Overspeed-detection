import axios from "axios";
import type {
  ProcessingResult,
  AnalyticsData,
  VehicleRecord,
  OverspeedResponse,
  HealthResponse,
  SystemInfo,
} from "../types/api";

// ─────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,
});

// ─────────────────────────────────────────────
// Upload Services
// ─────────────────────────────────────────────

export const uploadImage = async (
  file: File,
  onProgress?: (pct: number) => void
): Promise<ProcessingResult> => {
  const form = new FormData();
  form.append("file", file);

  const { data } = await api.post<ProcessingResult>("/api/upload/image", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
};

export const uploadVideo = async (
  file: File,
  onProgress?: (pct: number) => void
): Promise<ProcessingResult> => {
  const form = new FormData();
  form.append("file", file);

  const { data } = await api.post<ProcessingResult>("/api/upload/video", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
};

// ─────────────────────────────────────────────
// Analytics Services
// ─────────────────────────────────────────────

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const { data } = await api.get<AnalyticsData>("/api/analytics");
  return data;
};

export const fetchVehicles = async (): Promise<VehicleRecord[]> => {
  const { data } = await api.get<VehicleRecord[]>("/api/vehicles");
  return Array.isArray(data) ? data : [];
};

export const fetchOverspeed = async (): Promise<OverspeedResponse> => {
  const { data } = await api.get<OverspeedResponse>("/api/overspeed");
  return data;
};

export const fetchHealth = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>("/api/health");
  return data;
};

export const fetchSystemInfo = async (): Promise<SystemInfo> => {
  const { data } = await api.get<SystemInfo>("/api/system");
  return data;
};

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

export const getMediaUrl = (path: string): string =>
  `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

export default api;
