
import React, { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { CHART_DATA } from '../constants';
import { AisWeights, AdData } from '../types';
import { calculateExposure, calculateVAF, calculateAIS, calculateIntegrityScore } from '../logic';

interface AISChartsProps {
  weights: AisWeights;
  ads: AdData[];
  mode: 'hourly' | 'daily';
  onModeChange: (mode: 'hourly' | 'daily') => void;
  data: any[];
  isLive?: boolean;
}

const AISCharts: React.FC<AISChartsProps> = ({ weights, ads, mode, onModeChange, data, isLive }) => {
  // Derive dynamic chart data based on current weights
  const dynamicChartData = useMemo(() => {
    if (ads.length === 0 || isLive) return data;
    
    // Current weighted average
    const computedScores = ads.map(ad => {
      const safeWeights = weights || { force: 1, interrupt: 1, audio: 1, baseline: 30 };
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
      return calculateAIS(exp, vaf);
    });
    const currentAvg = computedScores.reduce((a, b) => a + b, 0) / computedScores.length;
    
    // Original average from chart baseline (roughly 15 range for stress)
    const baselineAvg = 15;
    const ratio = currentAvg / baselineAvg;

    // Scale the existing time-series pattern by the current weighted ratio
    return data.map(point => ({
      ...point,
      score: Math.round(point.score * ratio)
    }));
  }, [weights, ads, data, isLive]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900">AISスコア推移</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            {mode === 'hourly' ? 'AIS Score Trend (Hourly)' : 'AIS Score Trend (Daily)'}
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg">
          <button 
            onClick={() => onModeChange('hourly')}
            className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${mode === 'hourly' ? 'bg-white text-[#45A29E]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            時間別
          </button>
          <button 
            onClick={() => onModeChange('daily')}
            className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${mode === 'daily' ? 'bg-white text-[#45A29E]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            日別
          </button>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.4} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} 
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: '1px solid #f1f5f9', 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)'
              }}
              labelClassName="text-slate-400 mb-1"
              itemStyle={{ color: '#ef4444' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#ef4444" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorScore)" 
              animationDuration={1500}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AISCharts;
