// Server-side mirror of logic.ts scoring functions.
// Kept in sync with ../../logic.ts. If you change DEFAULT_WEIGHTS in logic.ts,
// update this file too (we cannot import .ts from logic.ts because Vercel
// functions are isolated from the Vite source tree at build time).

export interface AisWeights {
  force: number;
  interrupt: number;
  audio: number;
  baseline: number;
}

export const DEFAULT_WEIGHTS: AisWeights = {
  force: 1.7,
  interrupt: 1.5,
  audio: 1.3,
  baseline: 30
};

export const calculateExposure = (
  duration: number,
  isForced: boolean,
  isInterrupted: boolean,
  isAudioIntrusive: boolean,
  weights: AisWeights = DEFAULT_WEIGHTS
): number => {
  const f_w = isForced ? weights.force : 1.0;
  const i_w = isInterrupted ? weights.interrupt : 1.0;
  const a_w = isAudioIntrusive ? weights.audio : 1.0;
  return duration * f_w * i_w * a_w;
};

export const calculateVAF = (
  continueAfterAd: boolean,
  noMute: boolean,
  noSkip: boolean,
  noLeave: boolean
): number => {
  const isSkippedOrLeft = !continueAfterAd || !noSkip || !noLeave;
  return isSkippedOrLeft ? 0.25 : 1.0;
};

export const calculateAIS = (exposure: number, vaf: number): number =>
  exposure * (1 / vaf);

export type AisStatus = 'healthy' | 'warning' | 'critical';

export const classifyStatus = (ais: number): AisStatus => {
  if (ais <= 30) return 'healthy';
  if (ais <= 100) return 'warning';
  return 'critical';
};
