// POST /api/events
// Body: { adId, adName, adType, duration, isForced, isInterrupted, isAudioIntrusive,
//         userAction?, occupancy?, volumeLevel?, isSticky?, continueAfterAd?, noMute?,
//         noSkip?, noLeave?, timestamp? }
// Response: { aisScore, exposure, vaf, status, id }
//
// Persists the event into Supabase ais_events with server-calculated scores.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, EVENTS_TABLE } from './_lib/supabase';
import {
  calculateExposure,
  calculateVAF,
  calculateAIS,
  classifyStatus
} from './_lib/score';

interface EventInput {
  adId?: string;
  adName?: string;
  adType?: string;
  duration?: number;
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
  timestamp?: number | string;
}

const ALLOWED_AD_TYPES = new Set(['Popup', 'Banner', 'Native', 'Video']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for local dev / future SDK use
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const body: EventInput = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

  // Validate required fields
  const adId = body.adId?.toString().trim();
  const adName = body.adName?.toString().trim();
  const adType = body.adType?.toString().trim();
  const duration = Number(body.duration ?? 0);

  if (!adId || !adName || !adType) {
    return res
      .status(400)
      .json({ error: 'Missing required fields: adId, adName, adType.' });
  }
  if (!ALLOWED_AD_TYPES.has(adType)) {
    return res.status(400).json({
      error: `Invalid adType "${adType}". Must be one of: ${Array.from(ALLOWED_AD_TYPES).join(', ')}.`
    });
  }
  if (!Number.isFinite(duration) || duration < 0) {
    return res.status(400).json({ error: 'duration must be a non-negative number.' });
  }

  // Defaults
  const isForced = !!body.isForced;
  const isInterrupted = !!body.isInterrupted;
  const isAudioIntrusive = !!body.isAudioIntrusive;
  const continueAfterAd = body.continueAfterAd ?? true;
  const noMute = body.noMute ?? true;
  const noSkip = body.noSkip ?? true;
  const noLeave = body.noLeave ?? true;

  // Server-side scoring (authoritative)
  const exposure = calculateExposure(duration, isForced, isInterrupted, isAudioIntrusive);
  const vaf = calculateVAF(continueAfterAd, noMute, noSkip, noLeave);
  const aisScore = calculateAIS(exposure, vaf);
  const status = classifyStatus(aisScore);

  const clientTs = body.timestamp
    ? new Date(typeof body.timestamp === 'number' ? body.timestamp : body.timestamp).toISOString()
    : new Date().toISOString();

  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .insert({
      ad_id: adId,
      ad_name: adName,
      ad_type: adType,
      duration,
      occupancy: Number(body.occupancy ?? 0),
      volume_level: Number(body.volumeLevel ?? 0),
      is_sticky: !!body.isSticky,
      is_forced: isForced,
      is_interrupted: isInterrupted,
      is_audio_intrusive: isAudioIntrusive,
      continue_after_ad: continueAfterAd,
      no_mute: noMute,
      no_skip: noSkip,
      no_leave: noLeave,
      user_action: body.userAction ?? 'view',
      exposure,
      vaf,
      ais_score: aisScore,
      status,
      client_timestamp: clientTs
    })
    .select('id')
    .single();

  if (error) {
    console.error('[api/events] Supabase insert failed:', error);
    return res.status(500).json({
      error: 'Failed to persist event.',
      detail: error.message,
      hint: error.hint
    });
  }

  return res.status(200).json({
    id: data?.id,
    aisScore: Math.round(aisScore * 100) / 100,
    exposure: Math.round(exposure * 100) / 100,
    vaf,
    status
  });
}
