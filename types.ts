
export type AdType = 'Banner' | 'Video' | 'Popup' | 'Native';

export interface AdLog {
  duration: number;
  occupancy: number; // 占有率 (0-100)
  volumeLevel: number; // 音量 (0-100)
  isSticky: boolean; // 追従性
  isForced: boolean;
  isInterrupted: boolean;
  isAudioIntrusive: boolean;
  continueAfterAd: boolean;
  noMute: boolean;
  noSkip: boolean;
  noLeave: boolean;
}

export interface AdData {
  id: string;
  token?: string;
  name: string;
  type: AdType;
  log: AdLog;
  events: number;
  date: string;
  timestamp?: number;
  frustration?: number;
  dropOff?: number;
  avgScore?: number;
  latestScore?: number;
  allScores?: number[];
  totalScore?: number;
  status?: 'Positive' | 'Neutral' | 'Negative';
}

export interface AisWeights {
  force: number;
  interrupt: number;
  audio: number;
  baseline: number;
}

export interface KPI {
  label: string;
  englishLabel: string;
  value: string | number;
  trend: number;
  unit?: string;
}

export interface ChartDataPoint {
  time: string;
  score: number;
  events: number;
}
