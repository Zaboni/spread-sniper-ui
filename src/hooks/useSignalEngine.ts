import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types for the snapshot response
export interface RegimeProbs {
  low_vol?: number;
  high_vol?: number;
  crisis?: number;
}

export interface SnapshotRegime {
  label: string;
  probs: RegimeProbs;
  timestamp: string;
}

export interface SnapshotVol {
  vix: number | null;
  rv: number | null;
  ivRvSpread: number | null;
  vixHistory: Array<{ ts: string; value: number }>;
  ivRvHistory: Array<{ ts: string; value: number }>;
}

export interface SnapshotSpy {
  current: number | null;
  history: Array<{ ts: string; close: number }>;
}

export interface SnapshotNews {
  headline: string;
  scoredAt: string;
  sentiment: number;
  magnitude: string;
}

export interface SnapshotFomc {
  eventDate: string;
  eventType: string;
  hawkishScore: number | null;
}

export interface SnapshotRegimeHistory {
  ts: string;
  label: string;
}

export interface SnapshotPrediction {
  id: string;
  madeAt: string;
  horizon: string;
  predictedDirection: 'bull' | 'bear' | 'neutral';
  predictedProb: number;
  source: string;
  regimeAtPred: string | null;
}

export interface PredictionResult {
  id: string;
  madeAt: string;
  predictedDirection: string;
  correct: boolean;
}

export interface SnapshotPredictionAccuracy {
  totalResolved: number;
  predictions: PredictionResult[];
}

export interface DecayAlert {
  id: string;
  createdAt: string;
  source: string;
  alertLevel: 'warning' | 'critical';
  alertMessage: string;
  currentSharpe: number | null;
  historicalSharpe: number | null;
  sharpeZscore: number | null;
  recentAccuracy: number | null;
  historicalAccuracy: number | null;
  accuracyDecline: number | null;
  cusumBreaches: number | null;
}

export interface SignalEngineSnapshot {
  timestamp: string;
  regime: SnapshotRegime | null;
  vol: SnapshotVol;
  spy: SnapshotSpy;
  news: SnapshotNews[];
  fomc: SnapshotFomc | null;
  regimeHistory: SnapshotRegimeHistory[];
  latestPrediction: SnapshotPrediction | null;
  predictionAccuracy: SnapshotPredictionAccuracy;
  decayAlerts: DecayAlert[];
  _timings?: Record<string, number>;
  _totalMs?: number;
}

interface SnapshotState {
  data: SignalEngineSnapshot | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Single hook for all Signal Engine data.
 * Fetches everything in one request and polls every `pollInterval` ms.
 */
export function useSignalEngineSnapshot(pollInterval = 60000) {
  const [state, setState] = useState<SnapshotState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchSnapshot = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/signal-engine/snapshot`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (mountedRef.current) {
        setState({
          data,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchSnapshot();

    // Set up polling
    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchSnapshot, pollInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSnapshot, pollInterval]);

  return {
    ...state,
    refetch: fetchSnapshot,
  };
}

// Keep old hooks for backwards compatibility (deprecated)
// These now just call the snapshot endpoint and extract the relevant piece

function useSignalEngineApi<T>(endpoint: string) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_URL}/signal-engine${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/** @deprecated Use useSignalEngineSnapshot instead */
export function useSignalEngineRegime() {
  return useSignalEngineApi<{
    timestamp: string;
    regimeLabel: string;
    regimeProbs: RegimeProbs;
  } | { regime: null }>('/regime');
}

/** @deprecated Use useSignalEngineSnapshot instead */
export function useSignalEngineVol() {
  return useSignalEngineApi<{
    vix: number | null;
    vixTimestamp: string | null;
    rv: number | null;
    ivRvSpread: number | null;
    pricesTimestamp: string | null;
  }>('/vol');
}

/** @deprecated Use useSignalEngineSnapshot instead */
export function useSignalEngineNews(limit: number = 5) {
  return useSignalEngineApi<{
    news: Array<{
      scoredAt: string;
      headline: string;
      directionalSentiment: number;
      magnitude: string;
    }>;
  }>(`/news?limit=${limit}`);
}

/** @deprecated Use useSignalEngineSnapshot instead */
export function useSignalEngineFomc() {
  return useSignalEngineApi<{
    eventDate: string;
    eventType: string;
    hawkishScore: number | null;
    reasoning: string | null;
  } | { fomc: null }>('/fomc');
}

/** @deprecated Use useSignalEngineSnapshot instead */
export function useSignalEngineRegimeHistory(days: number = 90) {
  return useSignalEngineApi<{
    history: Array<{
      timestamp: string;
      regimeLabel: string;
      regimeProbs: RegimeProbs;
    }>;
  }>(`/regime-history?days=${days}`);
}
