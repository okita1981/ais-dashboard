// Client-side API layer.
// Talks to Vercel Functions at /api/events (POST) and /api/dashboard (GET).
// The legacy Google Apps Script endpoint has been retired in favor of Supabase.

import { AdData } from '../types';

export interface DashboardData {
  range: string;
  totalEvents: number;
  averageAIS: number;
  averageVAF: number;
  scoreDistribution: {
    healthy: number;
    warning: number;
    critical: number;
  };
  recentScores: { time: string; score: number; events: number }[];
  adRankings: {
    id: string;
    name: string;
    type: string;
    exposure: number;
    vaf: number;
    aisScore: number;
    events: number;
    status: 'healthy' | 'warning' | 'critical';
  }[];
}

export interface EventInput {
  adId: string;
  adName: string;
  adType: 'Popup' | 'Banner' | 'Native' | 'Video';
  duration: number;
  occupancy?: number;
  volumeLevel?: number;
  isSticky?: boolean;
  isForced?: boolean;
  isInterrupted?: boolean;
  isAudioIntrusive?: boolean;
  continueAfterAd?: boolean;
  noMute?: boolean;
  noSkip?: boolean;
  noLeave?: boolean;
  userAction?: 'view' | 'skip' | 'mute' | 'leave' | 'reset';
  timestamp?: number;
}

export interface EventResponse {
  id?: string;
  aisScore: number;
  exposure: number;
  vaf: number;
  status: 'healthy' | 'warning' | 'critical';
}

const API_BASE = ''; // same-origin

/**
 * Fetch aggregated dashboard data from Supabase via /api/dashboard.
 */
export const fetchDashboardData = async (
  range: '24h' | '7d' | '30d' | 'all' = '7d'
): Promise<DashboardData> => {
  const response = await fetch(`${API_BASE}/api/dashboard?range=${range}`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Dashboard API ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
};

/**
 * Send a single ad event to /api/events. Returns the server-calculated scores.
 */
export const postEvent = async (event: EventInput): Promise<EventResponse> => {
  const response = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Event API ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
};

/**
 * Backward-compat shim used by App.tsx legacy Live mode.
 * Converts aggregated DashboardData into AdData[] expected by the old UI flow.
 * New code should call fetchDashboardData() directly.
 */
export const fetchLiveAisData = async (): Promise<AdData[]> => {
  const dash = await fetchDashboardData('30d');
  return dash.adRankings.map(r => ({
    id: r.id,
    token: r.id,
    name: r.name,
    type: (r.type as AdData['type']) || 'Native',
    events: r.events,
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    avgScore: r.aisScore,
    latestScore: r.aisScore,
    totalScore: r.aisScore * r.events,
    status:
      r.status === 'healthy' ? 'Positive' : r.status === 'warning' ? 'Neutral' : 'Negative',
    log: {
      duration: 0,
      occupancy: 0,
      volumeLevel: 0,
      isSticky: false,
      isForced: false,
      isInterrupted: false,
      isAudioIntrusive: false,
      continueAfterAd: true,
      noMute: true,
      noSkip: true,
      noLeave: true
    }
  }));
};
