import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAnalytics, fetchVehicles, fetchOverspeed, fetchHealth } from "../services/api";
import type { AnalyticsData, VehicleRecord, OverspeedResponse, UploadState } from "../types/api";

// ─────────────────────────────────────────────
// useAnalytics — auto-refreshes every 15s
// ─────────────────────────────────────────────

export const useAnalytics = (refreshInterval = 15_000) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchAnalytics();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, refreshInterval);
    return () => clearInterval(timer);
  }, [load, refreshInterval]);

  return { data, loading, error, refresh: load };
};

// ─────────────────────────────────────────────
// useVehicles
// ─────────────────────────────────────────────

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchVehicles();
      setVehicles(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { vehicles, loading, error, refresh: load };
};

// ─────────────────────────────────────────────
// useOverspeed
// ─────────────────────────────────────────────

export const useOverspeed = () => {
  const [data, setData] = useState<OverspeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverspeed()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};

// ─────────────────────────────────────────────
// useApiStatus
// ─────────────────────────────────────────────

export const useApiStatus = () => {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  return online;
};

// ─────────────────────────────────────────────
// useUpload
// ─────────────────────────────────────────────

export const useUpload = (
  uploadFn: (file: File, onProgress: (p: number) => void) => Promise<any>
) => {
  const [state, setState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    result: null,
    error: null,
    file: null,
  });

  const upload = useCallback(
    async (file: File) => {
      setState({ status: "uploading", progress: 0, result: null, error: null, file });
      try {
        const result = await uploadFn(file, (pct) => {
          setState((s) => ({ ...s, progress: pct, status: pct < 100 ? "uploading" : "processing" }));
        });
        setState({ status: "done", progress: 100, result, error: null, file });
      } catch (e: any) {
        setState((s) => ({
          ...s,
          status: "error",
          error: e?.response?.data?.detail ?? e?.message ?? "Upload failed",
        }));
      }
    },
    [uploadFn]
  );

  const reset = useCallback(() => {
    setState({ status: "idle", progress: 0, result: null, error: null, file: null });
  }, []);

  return { ...state, upload, reset };
};
