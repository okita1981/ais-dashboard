
import React, { useMemo, useState, useRef, useEffect } from 'react';
import StatCards from './StatCards';
import AISCharts from './AISCharts';
import AdTable from './AdTable';
import { AisWeights, AdData, AdType } from '../types';
import { DEFAULT_WEIGHTS, calculateExposure, calculateVAF, calculateAIS, calculateIntegrityScore, getAISStatus } from '../logic';
import { MOCK_AD_DATA } from '../constants';
import { fetchLiveAisData } from '../services/api';

interface DashboardProps {
  weights: AisWeights;
  ads: AdData[];
  liveHistory: AdData[];
  dataMode: 'demo' | 'live';
  setDataMode: (mode: 'demo' | 'live') => void;
  isLiveLoading: boolean;
  selectedRange: string;
  setSelectedRange: (range: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  weights, 
  ads, 
  liveHistory, 
  dataMode, 
  setDataMode, 
  isLiveLoading,
  selectedRange,
  setSelectedRange
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [timeSeriesMode, setTimeSeriesMode] = useState<'hourly' | 'daily'>('hourly');
  const calendarRef = useRef<HTMLDivElement>(null);

  // Live Mode data aggregation for charts
  const liveChartData = useMemo(() => {
    if (dataMode !== 'live' || liveHistory.length === 0) return [];
    
    if (timeSeriesMode === 'hourly') {
      // Group by hour
      const hourlyMap = new Map<string, { scoreSum: number, count: number }>();
      
      liveHistory.forEach(ad => {
        const date = ad.timestamp ? new Date(ad.timestamp) : new Date();
        const hourStr = `${date.getHours().toString().padStart(2, '0')}:00`;
        
        const exp = calculateExposure(
          ad.log.duration, 
          Number(ad.log.occupancy) || 0, 
          Number(ad.log.volumeLevel) || 0, 
          ad.log.isSticky || false,
          ad.log.isForced, 
          ad.log.isInterrupted, 
          ad.log.isAudioIntrusive, 
          weights
        );
        const vaf = calculateVAF(ad.log.continueAfterAd, ad.log.noMute, ad.log.noSkip, ad.log.noLeave);
        const score = calculateAIS(exp, vaf);
        
        const existing = hourlyMap.get(hourStr) || { scoreSum: 0, count: 0 };
        hourlyMap.set(hourStr, { 
          scoreSum: existing.scoreSum + score, 
          count: existing.count + 1 
        });
      });
      
      return Array.from(hourlyMap.entries())
        .map(([time, data]) => ({
          time,
          score: Math.round(data.scoreSum / data.count),
          events: data.count
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
    } else {
      // Group by day
      const dailyMap = new Map<string, { scoreSum: number, count: number }>();
      
      liveHistory.forEach(ad => {
        const date = ad.timestamp ? new Date(ad.timestamp) : new Date();
        const dayStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        
        const exp = calculateExposure(
          ad.log.duration, 
          Number(ad.log.occupancy) || 0, 
          Number(ad.log.volumeLevel) || 0, 
          ad.log.isSticky || false,
          ad.log.isForced, 
          ad.log.isInterrupted, 
          ad.log.isAudioIntrusive, 
          weights
        );
        const vaf = calculateVAF(ad.log.continueAfterAd, ad.log.noMute, ad.log.noSkip, ad.log.noLeave);
        const score = calculateAIS(exp, vaf);
        
        const existing = dailyMap.get(dayStr) || { scoreSum: 0, count: 0 };
        dailyMap.set(dayStr, { 
          scoreSum: existing.scoreSum + score, 
          count: existing.count + 1 
        });
      });
      
      return Array.from(dailyMap.entries())
        .map(([time, data]) => ({
          time,
          score: Math.round(data.scoreSum / data.count),
          events: data.count
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
    }
  }, [dataMode, liveHistory, weights, timeSeriesMode]);

  // Time-series data generation (Demo mode)
  const chartData = useMemo(() => {
    if (timeSeriesMode === 'hourly') {
      return [
        { time: '09:00', score: 92, events: 450 },
        { time: '10:00', score: 88, events: 580 },
        { time: '11:00', score: 85, events: 720 },
        { time: '12:00', score: 78, events: 890 },
        { time: '13:00', score: 82, events: 650 },
        { time: '14:00', score: 75, events: 590 },
        { time: '15:00', score: 68, events: 920 },
        { time: '16:00', score: 72, events: 810 },
        { time: '17:00', score: 85, events: 1100 },
        { time: '18:00', score: 90, events: 1400 },
      ];
    } else {
      return [
        { time: '05/01', score: 88, events: 12000 },
        { time: '05/02', score: 85, events: 14500 },
        { time: '05/03', score: 82, events: 11000 },
        { time: '05/04', score: 78, events: 15600 },
        { time: '05/05', score: 84, events: 13200 },
        { time: '05/06', score: 80, events: 18900 },
        { time: '05/07', score: 86, events: 16400 },
      ];
    }
  }, [timeSeriesMode]);

  const currentChartData = useMemo(() => {
    if (dataMode === 'live' && liveChartData.length > 0) return liveChartData;
    return chartData;
  }, [dataMode, liveChartData, chartData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = useMemo(() => {
    if (dataMode === 'demo') {
      return { avg: 15.5, integrity: 84.5, positive: 70, neutral: 20, negative: 10 };
    }
    
    if (ads.length === 0) return { avg: 0, integrity: 100, positive: 0, neutral: 0, negative: 0 };
    
    const count = ads.length;
    const processedAds = ads.map(ad => {
      const stress = ad.avgScore || 0;
      const integrity = calculateIntegrityScore(stress);
      const status = ad.status || getAISStatus(integrity);
      return { ...ad, stress, integrity, status };
    });

    const avgStress = processedAds.reduce((acc, ad) => acc + ad.stress, 0) / count;
    const avgIntegrity = processedAds.reduce((acc, ad) => acc + ad.integrity, 0) / count;
    const positive = (processedAds.filter(ad => ad.status === 'Positive').length / count) * 100;
    const neutral = (processedAds.filter(ad => ad.status === 'Neutral').length / count) * 100;
    const negative = (processedAds.filter(ad => ad.status === 'Negative').length / count) * 100;

    return { avg: avgStress, integrity: avgIntegrity, positive, neutral, negative };
  }, [ads, dataMode]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-slate-900">AIS ダッシュボード</h2>
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
            {isLiveLoading && (
              <span className="flex items-center text-[10px] font-bold text-[#45A29E] animate-pulse">
                <span className="mr-1">⏳</span> FETCHING LIVE DATA...
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1 flex items-center text-sm">
            {dataMode === 'demo' ? '期間選択に連動するシミュレーションデータを表示中' : '外部APIから取得したリアルタイムデータを表示中'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative" ref={calendarRef}>
            <button 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span>📅</span>
              <span>{selectedRange}</span>
              <span className={`text-xs transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isCalendarOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-30 animate-in fade-in slide-in-from-top-1 duration-200">
                {['今日', '直近7日間', '直近30日間', '今月', 'カスタム範囲'].map(range => (
                  <button 
                    key={range}
                    onClick={() => { setSelectedRange(range); setIsCalendarOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${selectedRange === range ? 'text-[#45A29E] font-bold bg-[#45A29E]/5' : 'text-slate-600'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <StatCards 
        weights={weights} 
        ads={ads} 
        totalLiveEvents={liveHistory.length} 
        dataMode={dataMode} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AISCharts 
            weights={weights} 
            ads={ads} 
            mode={timeSeriesMode} 
            onModeChange={setTimeSeriesMode} 
            data={currentChartData}
            isLive={dataMode === 'live'}
          />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-1">スコア分布</h3>
          <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">Score Distribution</p>
          <div className="flex-1 flex flex-col justify-center items-center space-y-8 py-4 px-4">
            <div className="relative w-full aspect-square max-w-[180px] flex items-center justify-center">
              <svg 
                viewBox="0 0 200 200" 
                className="w-[90%] h-[90%] transform -rotate-90 overflow-visible"
                preserveAspectRatio="xMidYMid grow"
              >
                <circle cx="100" cy="100" r="70" stroke="#f1f5f9" strokeWidth="18" fill="transparent" />
                <circle
                  cx="100" cy="100" r="70" stroke="url(#ais-gradient)" strokeWidth="18" fill="transparent"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - (Math.min(stats.integrity, 100) / 100))}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="ais-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.avg.toFixed(0)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Stress</span>
                {dataMode === 'live' && liveChartData.length > 0 && (
                  <div className="mt-1 flex items-center space-x-1 bg-[#45A29E]/10 px-2 py-0.5 rounded-full border border-[#45A29E]/20">
                    <span className="w-1.5 h-1.5 bg-[#45A29E] rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black text-[#45A29E]">LATEST: {liveChartData[liveChartData.length - 1].score}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-bold text-green-700">Healthy (良好)</span>
                </div>
                <span className="text-xs font-black text-green-700">{stats.positive.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs font-bold text-amber-700">Warning (注意)</span>
                </div>
                <span className="text-xs font-black text-amber-700">{stats.neutral.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs font-bold text-red-700">Critical (危険)</span>
                </div>
                <span className="text-xs font-black text-red-700">{stats.negative.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdTable weights={weights} ads={ads} />
    </div>
  );
};

export default Dashboard;
