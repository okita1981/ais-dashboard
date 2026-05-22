
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Volume2,
  VolumeX,
  X,
  SkipForward,
  LogOut,
  RotateCcw,
  Activity,
  Zap,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Menu,
  Search,
  User
} from 'lucide-react';
import {
  calculateExposure,
  calculateVAF,
  calculateAIS,
  DEFAULT_WEIGHTS
} from '../logic';
import { AisWeights } from '../types';

interface DemoPageProps {
  weights?: AisWeights;
}

type AdType = 'popup' | 'banner' | 'native';

interface AdProfile {
  id: AdType;
  label: string;
  english: string;
  description: string;
  // Base log values applied while ad is in default (no user action) state
  occupancy: number;
  volumeLevel: number;
  isSticky: boolean;
  isForced: boolean;
  isInterrupted: boolean;
  isAudioIntrusive: boolean;
  // VAF base
  continueAfterAd: boolean;
  noMute: boolean;
  noSkip: boolean;
  noLeave: boolean;
  // Display
  durationCap: number; // seconds before ad auto-ends (0 = no cap)
  expectedTone: 'high' | 'mid' | 'low';
}

const AD_PROFILES: Record<AdType, AdProfile> = {
  popup: {
    id: 'popup',
    label: '全画面ポップアップ',
    english: 'Fullscreen Popup',
    description: 'スキップ不可・15秒の強制表示。最も侵入度が高いパターン。',
    occupancy: 90,
    volumeLevel: 0,
    isSticky: false,
    isForced: true,
    isInterrupted: true,
    isAudioIntrusive: false,
    continueAfterAd: false,
    noMute: true,
    noSkip: true,
    noLeave: true,
    durationCap: 15,
    expectedTone: 'high'
  },
  banner: {
    id: 'banner',
    label: '追従バナー',
    english: 'Sticky Banner',
    description: '画面に追従して表示し続ける、音声なしのバナー広告。',
    occupancy: 15,
    volumeLevel: 0,
    isSticky: true,
    isForced: true,
    isInterrupted: true,
    isAudioIntrusive: false,
    continueAfterAd: true,
    noMute: true,
    noSkip: true,
    noLeave: true,
    durationCap: 0,
    expectedTone: 'mid'
  },
  native: {
    id: 'native',
    label: 'ネイティブ広告',
    english: 'Native Embed',
    description: '記事の流れに自然に溶け込む、低侵入度の埋め込み広告。',
    occupancy: 25,
    volumeLevel: 0,
    isSticky: false,
    isForced: false,
    isInterrupted: false,
    isAudioIntrusive: false,
    continueAfterAd: true,
    noMute: true,
    noSkip: true,
    noLeave: true,
    durationCap: 0,
    expectedTone: 'low'
  }
};

const TICK_MS = 200;
const TICK_SEC = TICK_MS / 1000;

interface UserActions {
  skipped: boolean;
  muted: boolean;
  left: boolean;
}

const initialActions: UserActions = { skipped: false, muted: false, left: false };

const getScoreColor = (ais: number) => {
  if (ais <= 30) return { text: 'text-emerald-400', bg: 'bg-emerald-500', ring: 'ring-emerald-500/40', label: '良好', glow: 'shadow-emerald-500/30' };
  if (ais <= 100) return { text: 'text-amber-400', bg: 'bg-amber-500', ring: 'ring-amber-500/40', label: '注意', glow: 'shadow-amber-500/30' };
  return { text: 'text-rose-400', bg: 'bg-rose-500', ring: 'ring-rose-500/50', label: '要改善', glow: 'shadow-rose-500/40' };
};

const DemoPage: React.FC<DemoPageProps> = ({ weights }) => {
  const currentWeights = weights || DEFAULT_WEIGHTS;

  const [adType, setAdType] = useState<AdType>('popup');
  const [adActive, setAdActive] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [actions, setActions] = useState<UserActions>(initialActions);
  const [pulse, setPulse] = useState(false);

  const profile = AD_PROFILES[adType];

  // Reset when ad type changes
  useEffect(() => {
    setAdActive(true);
    setElapsed(0);
    setActions(initialActions);
    setPulse(false);
  }, [adType]);

  // Time ticking while ad is active
  useEffect(() => {
    if (!adActive) return;
    const interval = window.setInterval(() => {
      setElapsed(prev => {
        const next = prev + TICK_SEC;
        if (profile.durationCap > 0 && next >= profile.durationCap) {
          return profile.durationCap;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [adActive, profile.durationCap]);

  // Compute effective log values from base profile + user actions
  const effectiveLog = useMemo(() => {
    const log = {
      duration: elapsed,
      occupancy: profile.occupancy,
      volumeLevel: profile.volumeLevel,
      isSticky: profile.isSticky,
      isForced: profile.isForced,
      isInterrupted: profile.isInterrupted,
      isAudioIntrusive: actions.muted ? false : profile.isAudioIntrusive,
      continueAfterAd: profile.continueAfterAd && !actions.skipped && !actions.left && !actions.muted,
      noMute: actions.muted ? false : profile.noMute,
      noSkip: actions.skipped ? false : profile.noSkip,
      noLeave: actions.left ? false : profile.noLeave
    };
    return log;
  }, [elapsed, profile, actions]);

  const exposure = useMemo(
    () =>
      calculateExposure(
        effectiveLog.duration,
        effectiveLog.occupancy,
        effectiveLog.volumeLevel,
        effectiveLog.isSticky,
        effectiveLog.isForced,
        effectiveLog.isInterrupted,
        effectiveLog.isAudioIntrusive,
        currentWeights
      ),
    [effectiveLog, currentWeights]
  );

  const vaf = useMemo(
    () =>
      calculateVAF(
        effectiveLog.continueAfterAd,
        effectiveLog.noMute,
        effectiveLog.noSkip,
        effectiveLog.noLeave
      ),
    [effectiveLog]
  );

  const ais = useMemo(() => calculateAIS(exposure, vaf), [exposure, vaf]);

  // Pulse animation on AIS increase
  const prevAis = useRef(0);
  useEffect(() => {
    if (ais > prevAis.current + 0.5) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 500);
      prevAis.current = ais;
      return () => clearTimeout(t);
    }
    prevAis.current = ais;
  }, [ais]);

  const score = getScoreColor(ais);

  const handleSkip = () => {
    if (adType === 'popup' && elapsed < profile.durationCap) {
      // Popup cannot be skipped before 15s — still record the attempt as frustration
      setActions(prev => ({ ...prev, skipped: true }));
      return;
    }
    setActions(prev => ({ ...prev, skipped: true }));
    setAdActive(false);
  };

  const handleMute = () => {
    setActions(prev => ({ ...prev, muted: !prev.muted }));
  };

  const handleLeave = () => {
    setActions(prev => ({ ...prev, left: true }));
    setAdActive(false);
  };

  const handleReset = () => {
    setAdActive(true);
    setElapsed(0);
    setActions(initialActions);
    setPulse(false);
    prevAis.current = 0;
  };

  const popupSkippable = adType === 'popup' ? elapsed >= profile.durationCap : true;

  return (
    <div className="bg-slate-950 min-h-screen -m-6 md:-m-8 p-6 md:p-8 text-white">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Live Demo Site</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">デモサイト：AISリアルタイム計測</h1>
          <p className="text-sm text-slate-400 mt-2">広告の種類を切り替え、ユーザー行動を再現してAISスコアの変動を体感できます。</p>
        </div>
        <button
          onClick={handleReset}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-700"
        >
          <RotateCcw size={14} />
          リセット
        </button>
      </div>

      {/* Ad type tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(AD_PROFILES) as AdType[]).map(t => {
          const p = AD_PROFILES[t];
          const active = adType === t;
          return (
            <button
              key={t}
              onClick={() => setAdType(t)}
              className={`flex-1 min-w-[180px] text-left px-5 py-4 rounded-2xl border transition-all ${
                active
                  ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/30'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-200' : 'text-slate-500'}`}>
                  {p.english}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  p.expectedTone === 'high' ? 'bg-rose-500/20 text-rose-300' :
                  p.expectedTone === 'mid' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  AIS {p.expectedTone === 'high' ? '高' : p.expectedTone === 'mid' ? '中' : '低'}
                </span>
              </div>
              <p className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-200'}`}>{p.label}</p>
              <p className={`text-[11px] mt-1 leading-snug ${active ? 'text-blue-100' : 'text-slate-400'}`}>{p.description}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Sample web page in browser frame */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Browser chrome */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="ml-4 flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-[11px] text-slate-500 font-mono">
                https://daily-integrity.example.com/article/ais-launch
              </div>
            </div>

            {/* Site content */}
            <div className="relative bg-white text-slate-900" style={{ minHeight: 600 }}>
              {/* Fake site header */}
              <div className="border-b-2 border-black py-3 px-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Menu size={18} />
                  <Search size={18} />
                </div>
                <div className="text-xl font-black tracking-tighter italic uppercase border-x border-black px-4">
                  The Daily Integrity
                </div>
                <div className="flex items-center space-x-4">
                  <button className="bg-black text-white px-3 py-1 text-[10px] font-bold rounded">SUBSCRIBE</button>
                  <User size={18} />
                </div>
              </div>

              {/* Article */}
              <article className="px-8 py-8 space-y-4">
                <div className="flex items-center space-x-2 text-rose-600 font-bold text-[11px]">
                  <span className="bg-rose-600 text-white px-2 py-0.5">BREAKING</span>
                  <span>2026.05.20 14:32</span>
                </div>
                <h2 className="text-3xl font-black leading-tight">
                  広告業界に激震、新しい品質基準「AIS」が導入へ。
                </h2>
                <p className="text-base text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-4">
                  これまでブラックボックスだった「広告の侵入度」が可視化されることで、パブリッシャーと広告主のパワーバランスが変わる可能性があります。
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  デジタル広告の氾濫は限界に達しています。ウェブサイトを閲覧するたびに現れるポップアップ、勝手に流れ出す大音量の動画、そして本来読みたい記事を覆い隠すバナー。これらはユーザーの「アテンション」を奪うだけでなく、ブランドへの信頼を損なっています。
                </p>

                {/* Native ad slot — embedded in article */}
                {adType === 'native' && adActive && (
                  <NativeAd actions={actions} />
                )}

                <p className="text-sm leading-relaxed text-slate-700">
                  AIS (Attention Integrity Standard) は、広告がユーザーの注意をどれだけ奪い、自由意志を阻害したかを定量化する新しい指標です。Exposure（露出量）と VAF（Value After Forced）の2軸でスコアを算出し、ブランドが社会に与える「不快指数」を可視化します。
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  パブリッシャーは健全な収益化、広告主はブランド毀損の防止、ユーザーはより快適なWeb体験。AISが目指すのは三者にとって持続可能な広告エコシステムです。
                </p>
              </article>

              {/* Banner ad slot — sticky bottom of preview area */}
              {adType === 'banner' && adActive && (
                <StickyBanner actions={actions} />
              )}

              {/* Popup ad — overlays the preview area */}
              {adType === 'popup' && adActive && (
                <PopupAd
                  elapsed={elapsed}
                  cap={profile.durationCap}
                  actions={actions}
                  onClose={popupSkippable ? handleLeave : undefined}
                />
              )}
            </div>
          </div>

          {/* Action panel */}
          <div className="mt-4 bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">ユーザー行動シミュレーション</p>
            <div className="grid grid-cols-3 gap-3">
              <ActionButton
                icon={<SkipForward size={16} />}
                label={adType === 'popup' && !popupSkippable ? `スキップ不可 (${Math.max(0, profile.durationCap - elapsed).toFixed(1)}s)` : 'スキップ'}
                pressed={actions.skipped}
                disabled={!adActive}
                color="rose"
                onClick={handleSkip}
              />
              <ActionButton
                icon={actions.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                label={actions.muted ? 'ミュート中' : 'ミュート'}
                pressed={actions.muted}
                disabled={!adActive}
                color="amber"
                onClick={handleMute}
              />
              <ActionButton
                icon={<LogOut size={16} />}
                label="サイト離脱"
                pressed={actions.left}
                disabled={!adActive}
                color="violet"
                onClick={handleLeave}
              />
            </div>
            {!adActive && (
              <p className="text-[11px] text-slate-400 mt-3 text-center">
                広告は終了しました。リセットボタンで再シミュレーションできます。
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Real-time AIS panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Big AIS card */}
            <div
              className={`relative bg-slate-900 rounded-2xl border-2 p-6 transition-all duration-300 ${
                pulse ? 'border-rose-500 shadow-2xl shadow-rose-500/40 scale-[1.02]' : `border-slate-800 shadow-xl ${score.glow}`
              }`}
            >
              {pulse && (
                <div className="absolute inset-0 rounded-2xl bg-rose-500/10 animate-pulse pointer-events-none"></div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${adActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {adActive ? 'Live Measuring' : 'Stopped'}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${score.text} bg-white/5`}>
                  {score.label}
                </span>
              </div>

              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">AIS Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-7xl font-black tracking-tighter tabular-nums ${score.text} transition-colors duration-300`}>
                  {ais.toFixed(0)}
                </span>
                <span className="text-sm font-bold text-slate-500">pt</span>
              </div>

              {/* Threshold scale */}
              <div className="mt-4">
                <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-[20%] bg-emerald-500/30"></div>
                  <div className="absolute inset-y-0 left-[20%] w-[40%] bg-amber-500/30"></div>
                  <div className="absolute inset-y-0 left-[60%] w-[40%] bg-rose-500/30"></div>
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${score.bg} ring-4 ${score.ring} transition-all duration-300`}
                    style={{ left: `${Math.min(99, Math.max(0, (ais / 150) * 100))}%`, transform: 'translate(-50%, -50%)' }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-500 mt-1">
                  <span>0</span>
                  <span className="text-emerald-400">30</span>
                  <span className="text-amber-400">100</span>
                  <span className="text-rose-400">150+</span>
                </div>
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={<Activity size={14} />}
                label="Exposure"
                jp="露出量"
                value={exposure.toFixed(1)}
                color="text-blue-400"
              />
              <MetricCard
                icon={<Zap size={14} />}
                label="VAF"
                jp="自由意志"
                value={vaf.toFixed(2)}
                color="text-violet-400"
              />
            </div>

            {/* Log details */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">計測ログ</p>
              <div className="space-y-2 text-[11px]">
                <LogRow label="再生時間" value={`${elapsed.toFixed(1)} 秒`} />
                <LogRow label="占有率" value={`${profile.occupancy}%`} />
                <LogRow label="強制再生" value={effectiveLog.isForced ? 'YES' : 'NO'} bad={effectiveLog.isForced} />
                <LogRow label="行動割り込み" value={effectiveLog.isInterrupted ? 'YES' : 'NO'} bad={effectiveLog.isInterrupted} />
                <LogRow label="音声侵入" value={effectiveLog.isAudioIntrusive ? 'YES' : 'NO'} bad={effectiveLog.isAudioIntrusive} />
                <LogRow label="スキップ操作" value={actions.skipped ? '実行' : '未操作'} bad={actions.skipped} />
                <LogRow label="ミュート操作" value={actions.muted ? '実行' : '未操作'} bad={actions.muted} />
                <LogRow label="離脱操作" value={actions.left ? '実行' : '未操作'} bad={actions.left} />
              </div>
            </div>

            {/* Status hint */}
            <div className={`rounded-2xl p-4 border ${
              ais <= 30 ? 'bg-emerald-500/10 border-emerald-500/30' :
              ais <= 100 ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-rose-500/10 border-rose-500/30'
            }`}>
              <div className="flex items-start gap-2">
                {ais <= 30 ? <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" /> :
                 ais <= 100 ? <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" /> :
                 <ShieldAlert size={16} className="text-rose-400 mt-0.5 shrink-0" />}
                <p className="text-xs leading-relaxed text-slate-200">
                  {ais <= 30 && '良好な状態です。ユーザーフレンドリーな広告設計が維持されています。'}
                  {ais > 30 && ais <= 100 && '注意レベル。広告の表示時間や占有率を見直すことで改善できます。'}
                  {ais > 100 && '要改善。ブランド毀損リスクが高い状態です。強制性と侵入度の見直しを推奨します。'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ Sub-components ============

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  pressed: boolean;
  disabled: boolean;
  color: 'rose' | 'amber' | 'violet';
  onClick: () => void;
}> = ({ icon, label, pressed, disabled, color, onClick }) => {
  const colorMap = {
    rose: pressed ? 'bg-rose-600 border-rose-500 text-white shadow-rose-500/30' : 'border-slate-700 hover:border-rose-500 hover:text-rose-400 text-slate-300',
    amber: pressed ? 'bg-amber-600 border-amber-500 text-white shadow-amber-500/30' : 'border-slate-700 hover:border-amber-500 hover:text-amber-400 text-slate-300',
    violet: pressed ? 'bg-violet-600 border-violet-500 text-white shadow-violet-500/30' : 'border-slate-700 hover:border-violet-500 hover:text-violet-400 text-slate-300'
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
        colorMap[color]
      } ${pressed ? 'shadow-lg' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  jp: string;
  value: string;
  color: string;
}> = ({ icon, label, jp, value, color }) => (
  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
    <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-3xl font-black tracking-tight tabular-nums ${color}`}>{value}</p>
    <p className="text-[10px] text-slate-500 mt-1">{jp}</p>
  </div>
);

const LogRow: React.FC<{ label: string; value: string; bad?: boolean }> = ({ label, value, bad }) => (
  <div className="flex justify-between items-center">
    <span className="text-slate-400">{label}</span>
    <span className={`font-bold tabular-nums ${bad ? 'text-rose-400' : 'text-slate-200'}`}>{value}</span>
  </div>
);

// Native ad — looks like a recommendation card inside the article
const NativeAd: React.FC<{ actions: UserActions }> = ({ actions }) => (
  <div className={`my-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition-opacity ${actions.left ? 'opacity-40' : ''}`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">PR</span>
      <span className="text-[10px] text-slate-500">Global Brands Inc.</span>
    </div>
    <div className="flex gap-3">
      <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg shrink-0"></div>
      <div>
        <p className="text-sm font-bold leading-tight mb-1">次世代スマートデバイスで、あなたの生活をより豊かに。</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">記事の流れに自然に溶け込むネイティブ広告。低侵入度のためAISスコアは低く推移します。</p>
        <button className="mt-2 text-[10px] font-bold text-blue-600 flex items-center">
          詳細はこちら <ChevronRight size={10} />
        </button>
      </div>
    </div>
  </div>
);

// Sticky banner — fixed to bottom of preview area
const StickyBanner: React.FC<{ actions: UserActions }> = ({ actions }) => (
  <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 shadow-2xl transition-transform ${actions.left ? 'translate-y-full' : 'translate-y-0'}`}>
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <Zap size={20} />
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase opacity-70 tracking-widest">Sponsored</p>
          <p className="text-sm font-bold leading-tight">追従バナー：常に画面に張り付き続ける広告</p>
        </div>
      </div>
      <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-black shrink-0 hover:bg-indigo-50 transition-colors">
        クリック
      </button>
    </div>
  </div>
);

// Popup ad — fullscreen overlay of the preview area
const PopupAd: React.FC<{
  elapsed: number;
  cap: number;
  actions: UserActions;
  onClose?: () => void;
}> = ({ elapsed, cap, actions, onClose }) => {
  const remaining = Math.max(0, cap - elapsed);
  return (
    <div className={`absolute inset-0 z-20 flex items-center justify-center p-6 transition-opacity ${actions.left ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
        {/* Close button — only available after countdown */}
        <button
          onClick={onClose}
          disabled={!onClose}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            onClose
              ? 'bg-black/70 hover:bg-black text-white cursor-pointer'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          {onClose ? <X size={16} /> : <span className="text-[10px] font-black">{remaining.toFixed(0)}s</span>}
        </button>

        <div className="h-40 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-[10px] font-black tracking-widest uppercase opacity-80">Limited Time</p>
            <p className="text-3xl font-black mt-1">SALE 70% OFF</p>
          </div>
        </div>
        <div className="p-6 text-slate-900">
          <span className="text-[10px] font-black text-rose-600 tracking-widest uppercase">Exclusive Offer</span>
          <h3 className="text-xl font-black leading-tight mt-2">今だけ全画面で割り込む特別オファー</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            この広告は15秒間スキップできません。ユーザーの注意を強制的に奪うため、AISスコアは急上昇します。
          </p>
          <button className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-rose-300/50 transition-all active:scale-95">
            今すぐ申し込む
          </button>
          {/* Countdown bar */}
          <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-200"
              style={{ width: `${Math.min(100, (elapsed / cap) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
