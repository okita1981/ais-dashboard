
import React, { useState, useMemo } from 'react';
import { AdData, AisWeights } from '../types';
import { calculateExposure, calculateVAF, calculateAIS, calculateIntegrityScore, DEFAULT_WEIGHTS } from '../logic';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';
import { ChevronDown, Info, Zap, Activity, Filter } from 'lucide-react';

interface AnalysisViewProps {
  ads: AdData[];
  weights: AisWeights;
  liveHistory: AdData[];
  dataMode: 'demo' | 'live';
  setDataMode: (mode: 'demo' | 'live') => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ ads, weights, liveHistory, dataMode, setDataMode }) => {
  const [selectedToken, setSelectedToken] = useState(ads[0]?.token || ads[0]?.id || '');

  // Update selectedToken if it's no longer valid or if we just switched to a mode with data
  React.useEffect(() => {
    if (ads.length > 0) {
      const currentExists = ads.some(ad => (ad.token || ad.id) === selectedToken);
      if (!currentExists || !selectedToken) {
        setSelectedToken(ads[0].token || ads[0].id || '');
      }
    }
  }, [ads, selectedToken]);

  const filteredHistory = useMemo(() => {
    const safeWeights = weights || DEFAULT_WEIGHTS;

    if (dataMode === 'demo') {
      // Demo mode: generate dummy time-series for the selected ad
      const ad = ads.find(a => (a.token || a.id) === selectedToken) || ads[0];
      const data = [];
      const maxSeconds = ad?.log.duration || 30;
      for (let i = 0; i <= maxSeconds; i += 2) {
        const dropRate = Math.pow(i / maxSeconds, 1.5) * 40;
        const frustration = i > 5 ? (Math.sin(i / 3) * 10 + (i * 0.8)) : 2;
        data.push({
          time: `${i}s`,
          drops: Math.round(dropRate),
          frustration: Math.round(frustration),
          aisScore: Math.round(Math.max(0, 100 - (frustration * 2))) // Integrity score
        });
      }
      return data;
    } else {
      // Live mode: use raw history filtered by token
      // Sort by timestamp (A column in spreadsheet)
      return liveHistory
        .filter(ad => (ad.token || ad.id) === selectedToken)
        .map(ad => {
          const exp = calculateExposure(
            ad.log.duration || 0, 
            Number(ad.log.occupancy) || 0, 
            Number(ad.log.volumeLevel) || 0, 
            !!ad.log.isSticky,
            !!ad.log.isForced, 
            !!ad.log.isInterrupted, 
            !!ad.log.isAudioIntrusive, 
            safeWeights
          );
          const vaf = calculateVAF(ad.log.continueAfterAd, ad.log.noMute, ad.log.noSkip, ad.log.noLeave);
          const stress = calculateAIS(exp, vaf);
          const integrity = calculateIntegrityScore(stress);

          // Frustration logic for live: 100 - integrity
          const frustration = Math.max(0, 100 - integrity);
          // status: removed -> drop event
          const isRemoved = ad.status === 'removed';

          return {
            time: ad.timestamp ? new Date(ad.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00',
            drops: isRemoved ? 100 : 0, // Visual spike for removal
            frustration: frustration,
            aisScore: integrity,
            rawTimestamp: ad.timestamp ? new Date(ad.timestamp).getTime() : 0,
            status: ad.status
          };
        })
        .sort((a, b) => a.rawTimestamp - b.rawTimestamp);
    }
  }, [selectedToken, liveHistory, dataMode, ads, weights]);

  const selectedAd = useMemo(() => {
    return ads.find(ad => (ad.token || ad.id) === selectedToken) || ads[0];
  }, [ads, selectedToken]);

  const metrics = useMemo(() => {
    if (!selectedAd) return { exposure: 0, vaf: 0 };
    const exp = calculateExposure(
      selectedAd.log.duration, 
      selectedAd.log.occupancy || 50,
      selectedAd.log.volumeLevel || 50,
      selectedAd.log.isSticky || false,
      selectedAd.log.isForced, 
      selectedAd.log.isInterrupted, 
      selectedAd.log.isAudioIntrusive, 
      weights
    );
    const vaf = calculateVAF(
      selectedAd.log.continueAfterAd, 
      selectedAd.log.noMute, 
      selectedAd.log.noSkip, 
      selectedAd.log.noLeave
    );
    return { exposure: exp, vaf };
  }, [selectedAd, weights]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-slate-900">詳細分析 (Micro Analysis)</h2>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setDataMode('demo')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${dataMode === 'demo' ? 'bg-white text-[#45A29E] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                DEMO
              </button>
              <button 
                onClick={() => setDataMode('live')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${dataMode === 'live' ? 'bg-[#45A29E] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                LIVE
              </button>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {dataMode === 'live' 
              ? 'スプレッドシートの生データを時系列で描画し、ストレスと離脱の相関を分析します。' 
              : '特定のアセットに対するユーザー行動のシミュレーション分析を行います。'}
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select 
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none pr-8 cursor-pointer appearance-none"
          >
            {ads.map(ad => (
              <option key={ad.token || ad.id} value={ad.token || ad.id}>
                {dataMode === 'live' ? (ad.token || ad.id) : ad.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="text-slate-400 -ml-6 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Zap size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Exposure</p>
            <h3 className="text-4xl font-black text-slate-900">{metrics.exposure.toFixed(1)}</h3>
            <p className="text-xs text-slate-500 mt-1">侵入度（露出ストレス）の合計値</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience Factor (VAF)</p>
            <h3 className="text-4xl font-black text-slate-900">{metrics.vaf.toFixed(2)}</h3>
            <p className="text-xs text-slate-500 mt-1">ユーザーによる受容性の係数</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {dataMode === 'live' ? '生データ時系列分析' : '時間経過によるユーザー反応推移'}
            </h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              {dataMode === 'live' ? 'Raw Data Correlation: AIS Score vs Drop-off' : 'User Retention & Frustration Timeline'}
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-bold text-slate-600">AISスコア (Integrity)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-xs font-bold text-slate-600">不快感 (Frustration)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span className="text-xs font-bold text-slate-600">離脱イベント (Drop-off)</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAIS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFrust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="drops" stroke="#cbd5e1" strokeWidth={2} fill="#f1f5f9" fillOpacity={0.5} name="離脱イベント" />
              <Area type="monotone" dataKey="frustration" stroke="#ef4444" strokeWidth={2} fill="url(#colorFrust)" name="不快感" />
              <Area type="monotone" dataKey="aisScore" stroke="#2563eb" strokeWidth={3} fill="url(#colorAIS)" name="AISスコア" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100 flex items-start space-x-6">
        <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm shrink-0">
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900">ミクロ分析インサイト</h4>
          <p className="text-sm text-blue-700 mt-2 leading-relaxed">
            {dataMode === 'live' 
              ? `トークン「${selectedToken}」の生データを確認すると、AISスコア（Stress）のスパイクと離脱（Drop-off）の発生タイミングに強い相関が見られます。`
              : 'このアセットは再生開始5秒後から「不快操作（ミュート試行やスキップ連打）」が急増し、AISスコアが危険水域に達しています。'}
            特に強制視聴設定がユーザーのストレスを誘発している可能性が高いため、クリエイティブの冒頭5秒でメリットを提示するか、スキップ可能時間を早めることを推奨します。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
