// GET /api/dashboard?range=24h|7d|30d|all
// Aggregates ais_events into the shape expected by Dashboard.tsx.
//
// Response shape:
// {
//   totalEvents, averageAIS, averageVAF,
//   scoreDistribution: { healthy, warning, critical },
//   recentScores: [{ time: 'HH:00', score }],
//   adRankings: [{ id, name, type, exposure, vaf, aisScore, status, events }]
// }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, EVENTS_TABLE } from './_lib/supabase';

interface EventRow {
  id: string;
  ad_id: string;
  ad_name: string;
  ad_type: string;
  exposure: number;
  vaf: number;
  ais_score: number;
  status: 'healthy' | 'warning' | 'critical';
  created_at: string;
}

const RANGE_HOURS: Record<string, number | null> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  all: null
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed. Use GET.' });

  const range = (req.query.range as string) ?? '7d';
  const hours = RANGE_HOURS[range] ?? RANGE_HOURS['7d'];

  let query = supabase
    .from(EVENTS_TABLE)
    .select('id, ad_id, ad_name, ad_type, exposure, vaf, ais_score, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (hours !== null) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[api/dashboard] Supabase query failed:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard data.',
      detail: error.message
    });
  }

  const rows: EventRow[] = (data ?? []) as EventRow[];

  // Aggregate totals
  const totalEvents = rows.length;
  const averageAIS = totalEvents
    ? rows.reduce((s, r) => s + Number(r.ais_score), 0) / totalEvents
    : 0;
  const averageVAF = totalEvents
    ? rows.reduce((s, r) => s + Number(r.vaf), 0) / totalEvents
    : 1;

  // Score distribution (percent)
  const dist = { healthy: 0, warning: 0, critical: 0 };
  rows.forEach(r => {
    dist[r.status] = (dist[r.status] || 0) + 1;
  });
  const distPct = totalEvents
    ? {
        healthy: (dist.healthy / totalEvents) * 100,
        warning: (dist.warning / totalEvents) * 100,
        critical: (dist.critical / totalEvents) * 100
      }
    : { healthy: 0, warning: 0, critical: 0 };

  // Recent scores: bucket by hour, last 10 buckets with data
  const hourBuckets = new Map<string, { sum: number; count: number; ts: number }>();
  rows.forEach(r => {
    const d = new Date(r.created_at);
    const key = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:00`;
    const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
    const b = hourBuckets.get(key) ?? { sum: 0, count: 0, ts };
    b.sum += Number(r.ais_score);
    b.count += 1;
    hourBuckets.set(key, b);
  });
  const recentScores = Array.from(hourBuckets.entries())
    .map(([time, b]) => ({
      time,
      score: Math.round(b.sum / b.count),
      events: b.count,
      _ts: b.ts
    }))
    .sort((a, b) => a._ts - b._ts)
    .slice(-12)
    .map(({ _ts, ...rest }) => rest);

  // Ad rankings: group by ad_id, average score & event count
  const adGroups = new Map<
    string,
    {
      id: string;
      name: string;
      type: string;
      sumExp: number;
      sumVaf: number;
      sumAis: number;
      events: number;
    }
  >();
  rows.forEach(r => {
    const g = adGroups.get(r.ad_id) ?? {
      id: r.ad_id,
      name: r.ad_name,
      type: r.ad_type,
      sumExp: 0,
      sumVaf: 0,
      sumAis: 0,
      events: 0
    };
    g.sumExp += Number(r.exposure);
    g.sumVaf += Number(r.vaf);
    g.sumAis += Number(r.ais_score);
    g.events += 1;
    g.name = r.ad_name; // keep most recent name
    adGroups.set(r.ad_id, g);
  });

  const classify = (ais: number) =>
    ais <= 30 ? 'healthy' : ais <= 100 ? 'warning' : 'critical';

  const adRankings = Array.from(adGroups.values())
    .map(g => ({
      id: g.id,
      name: g.name,
      type: g.type,
      exposure: Math.round((g.sumExp / g.events) * 100) / 100,
      vaf: Math.round((g.sumVaf / g.events) * 100) / 100,
      aisScore: Math.round((g.sumAis / g.events) * 100) / 100,
      events: g.events,
      status: classify(g.sumAis / g.events)
    }))
    .sort((a, b) => b.aisScore - a.aisScore);

  // Cache for 5s — dashboard polls every few seconds, this keeps things snappy.
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=15');

  return res.status(200).json({
    range,
    totalEvents,
    averageAIS: Math.round(averageAIS * 100) / 100,
    averageVAF: Math.round(averageVAF * 100) / 100,
    scoreDistribution: {
      healthy: Math.round(distPct.healthy * 10) / 10,
      warning: Math.round(distPct.warning * 10) / 10,
      critical: Math.round(distPct.critical * 10) / 10
    },
    recentScores,
    adRankings
  });
}
