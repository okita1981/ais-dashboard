
import { AisWeights } from './types';

/**
 * AIS Technical Specification Implementation
 * Based on PDF pages 4, 5, and 6.
 */

export const DEFAULT_WEIGHTS: AisWeights = {
  force: 1.7,      // 強制再生
  interrupt: 1.5,  // 行動割り込み
  audio: 1.3,      // 音声侵入
  baseline: 30     // ターゲット基準値
};

export const calculateExposure = (
  duration: number,
  occupancy: number,
  volumeLevel: number,
  isSticky: boolean,
  isForced: boolean,
  isInterrupted: boolean,
  isAudioIntrusive: boolean,
  weights: AisWeights
): number => {
  const w = weights || DEFAULT_WEIGHTS;
  
  // Weights = (isForced ? force : 1.0) * (isInterrupted ? interrupt : 1.0) * (isAudioIntrusive ? audio : 1.0)
  const f_w = isForced ? (w.force ?? 1.0) : 1.0;
  const i_w = isInterrupted ? (w.interrupt ?? 1.0) : 1.0;
  const a_w = isAudioIntrusive ? (w.audio ?? 1.0) : 1.0;
  
  const weightFactor = f_w * i_w * a_w;
  
  // Exposure = duration * Weights
  return duration * weightFactor;
};

/**
 * VAF (Value After Forced): ユーザーの自由意志の阻害度の逆数。
 * 阻害要因（ミュート不可、スキップ不可、離脱不可）が多いほど、VAFは小さくなる。
 */
export const calculateVAF = (
  continueAfterAd: boolean,
  noMute: boolean,
  noSkip: boolean,
  noLeave: boolean
): number => {
  // ユーザーが広告を消去 (skip/leave) したら VAF = 0.25、継続視聴なら VAF = 1.0
  // ここでは引数に基づいて簡易的に判定（実際はSDK側で状態に応じて切り替える）
  const isSkippedOrLeft = !continueAfterAd || !noSkip || !noLeave;
  return isSkippedOrLeft ? 0.25 : 1.0;
};

export const calculateAIS = (exposure: number, vaf: number): number => {
  // AIS = Exposure * (1 / VAF)
  // 不快指数が高いほど数値が上がる（300, 400等）「ブランド毀損メーター」
  return exposure * (1 / vaf);
};

/**
 * AIS Integrity Score: 0-100 scale where 100 is perfect.
 * 毀損メーター(AIS)をビジネス指標(0-100)に変換
 */
export const calculateIntegrityScore = (stressScore: number): number => {
  // 基準値(30)をベースに、ストレスが増えるほどスコアが下がる
  // 例: Stress 0 -> 100, Stress 30 -> 70, Stress 100 -> 0
  const integrity = 100 - stressScore;
  return Math.max(0, Math.min(100, Math.round(integrity)));
};

export const getAISStatus = (integrityScore: number): 'Positive' | 'Neutral' | 'Negative' => {
  if (integrityScore >= 80) return 'Positive';
  if (integrityScore >= 50) return 'Neutral';
  return 'Negative';
};

export const getImprovementAdvice = (
  exposure: number, 
  vaf: number, 
  ad: { occupancy: number; volumeLevel: number; isSticky: boolean; isForced: boolean; noSkip: boolean; noMute: boolean }
): string[] => {
  const advice: string[] = [];
  
  // 鋭い診断コメントの生成
  if (ad.occupancy > 70) {
    advice.push('画面占有率が過大。視覚的圧迫感がブランド毀損リスクを高めています。');
  }
  if (ad.noSkip && ad.isForced) {
    advice.push('強制視聴かつスキップ不可。ユーザーの自由意志を完全に阻害しています。');
  }
  if (ad.volumeLevel > 80 && !ad.noMute) {
    advice.push('高音量での自動再生。聴覚的な不快指数が極めて高い状態です。');
  }
  if (ad.isSticky) {
    advice.push('追従型配置による執拗なアテンション獲得は、嫌悪感に直結します。');
  }
  if (vaf < 0.2) {
    advice.push('「有益性(VAF)」が壊滅的。広告後の離脱率上昇が懸念されます。');
  }

  if (advice.length === 0) {
    if (exposure > 50) {
      advice.push('表示時間の抑制、または占有率の低減を推奨します。');
    } else {
      advice.push('現在の品質を維持。ユーザーフレンドリーな設計です。');
    }
  }
  
  return advice;
};
