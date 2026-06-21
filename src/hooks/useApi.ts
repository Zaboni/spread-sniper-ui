import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(endpoint: string, options?: RequestInit) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_URL}${endpoint}`, options);
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
  }, [endpoint, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

export function useOverview() {
  return useApi<{
    accountValue: number;
    todayPnL: number;
    regime: string;
    regimeConfidence: number;
    vix: number;
    ivRvSpread: number;
    shouldTrade: boolean;
    openPositions: number;
    lastScanTimestamp: string | null;
    spyPrice: number;
  }>('/overview');
}

export function usePerformance() {
  return useApi<{
    equityCurve: Array<{ date: string; value: number }>;
    drawdown: Array<{ date: string; drawdown: number; equity: number }>;
    winRate: { wins: number; losses: number; total: number; percentage: number };
    strategyPnL: Array<{ strategy: string; pnl: number; tradeCount: number }>;
    regimePnL: Array<{ regime: string; pnl: number; tradeCount: number }>;
    monthlyReturns: Array<{ month: string; pnl: number }>;
  }>('/performance');
}

export function useScanner(limit: number = 50) {
  return useApi<{
    scans: Array<{
      timestamp: string;
      regime: string;
      regimeConfidence: number;
      iv_rv_spread: number;
      iv_rv_threshold: number;
      vix: number;
      iv_rank: number;
      spy_price: number;
      setups_found: number;
      trades_executed: number;
    }>;
    candidates: Array<{
      symbol: string;
      expiration: string;
      strike: number;
      optionType: string;
      bid: number;
      ask: number;
      iv: number;
      delta: number;
      gamma: number;
      theta: number;
      vega: number;
      openInterest: number;
      volume: number;
      timestamp: string;
    }>;
  }>(`/scanner?limit=${limit}`);
}

export function useTrades(filters: {
  strategy?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.strategy) params.append('strategy', filters.strategy);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.offset) params.append('offset', String(filters.offset));

  return useApi<{
    trades: Array<{
      id: number;
      symbol: string;
      strategy: string;
      regime: string;
      entryTime: string;
      exitTime: string | null;
      entryPrice: number;
      exitPrice: number;
      quantity: number;
      pnl: number;
      status: string;
      notes: string | null;
    }>;
    filters: {
      strategies: string[];
      statuses: string[];
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  }>(`/trades?${params.toString()}`);
}

export function useRisk() {
  return useApi<{
    exposure: { current: number; percent: number; maxPercent: number };
    settledCash: number;
    accountValue: number;
    drawdown: {
      weekly: { amount: number; percent: number };
      monthly: { amount: number; percent: number };
    };
    circuitBreakerActive: boolean;
    backwardationActive: boolean;
    correlatedIndexPositions: { count: number; max: number };
  }>('/risk');
}

export function useRegimeHistory(days: number = 90) {
  return useApi<{
    history: Array<{
      regime: string;
      probability: number;
      timestamp: string;
    }>;
  }>(`/regime-history?days=${days}`);
}
