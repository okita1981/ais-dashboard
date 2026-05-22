
import React from 'react';
import { KPI, AisWeights, AdData } from '../types';
import { calculateExposure, calculateVAF, calculateAIS, calculateIntegrityScore } from '../logic';
import { Users, Target, Activity, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardsProps {
  weights: AisWeights;
  ads: AdData[];
  totalLiveEvents?: number;
  dataMode?: 'demo' | 'live';
}

const StatCards: React.FC<StatCardsProps> = ({ weights, ads, totalLiveEvents, dataMode }) => {
  // Compute scores on the fly based on current weights
  const computedData = ads.map(ad => {
    // Use pre-calculated avgScore if available (Live mode)
    if (ad.avgScore !== undefined) {
      const stress = ad.avgScore;
      const integrity = calculateIntegrityScore(stress);
      return { ...ad, aisScore: stress, integrityScore: integrity, vaf: 1.0 }; // VAF is 1.0 for avg
    }

    const exp = calculateExposure(
      ad.log.duration || 0, 
      Number(ad.log.occupancy) || 0, 
      Number(ad.log.volumeLevel) || 0, 
      !!ad.log.isSticky,
      !!ad.log.isForced, 
      !!ad.log.isInterrupted, 
      !!ad.log.isAudioIntrusive, 
      weights
    );
    const vaf = calculateVAF(ad.log.continueAfterAd, ad.log.noMute, ad.log.noSkip, ad.log.noLeave);
    const stress = calculateAIS(exp, vaf);
    const integrity = calculateIntegrityScore(stress);
    return { ...ad, exposure: exp, vaf, aisScore: stress, integrityScore: integrity };
  });

  // If in live mode, use the totalLiveEvents count (total rows)
  // Otherwise sum up the events from the ads array
  const totalEvents = (dataMode === 'live' && totalLiveEvents !== undefined) 
    ? totalLiveEvents 
    : computedData.reduce((acc, curr) => acc + (curr.events || 0), 0);
    
  const avgAIS = computedData.length > 0 ? computedData.reduce((acc, curr) => acc + curr.aisScore, 0) / computedData.length : 0;
  const avgIntegrity = computedData.length > 0 ? computedData.reduce((acc, curr) => acc + curr.integrityScore, 0) / computedData.length : 0;
  const avgVAF = computedData.length > 0 ? computedData.reduce((acc, curr) => acc + curr.vaf, 0) / computedData.length : 0;
  const improvementPotential = Math.max(0, 100 - avgIntegrity);

  const kpis: (KPI & { icon: React.ReactNode, color: string })[] = [
    {
      label: '総イベント数',
      englishLabel: 'Total Events',
      value: totalEvents.toLocaleString(),
      trend: 12.5,
      unit: '件',
      icon: <span>👥</span>,
      color: 'ais'
    },
    {
      label: '平均AIS (不快指数)',
      englishLabel: 'Average Stress Score',
      value: avgAIS.toFixed(0),
      trend: 2.3,
      unit: 'pt',
      icon: <span>🔥</span>,
      color: 'ais'
    },
    {
      label: 'ブランド健全性',
      englishLabel: 'Integrity Score',
      value: avgIntegrity.toFixed(1),
      trend: -1.5,
      unit: '%',
      icon: <span>🛡️</span>,
      color: 'ais'
    },
    {
      label: '改善の伸びしろ',
      englishLabel: 'Improvement Potential',
      value: improvementPotential.toFixed(1),
      trend: -8.4,
      unit: 'pt',
      icon: <span>⚡</span>,
      color: 'ais'
    },
  ];

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'ais': return 'bg-[#45A29E]/10 text-[#45A29E] group-hover:ring-[#45A29E]/20';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl transition-all duration-300 ring-4 ring-transparent ${getColorClasses(kpi.color)}`}>
              {kpi.icon}
            </div>
            <div className={`flex items-center text-xs font-bold ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {kpi.trend >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {Math.abs(kpi.trend)}%
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</span>
              {kpi.unit && <span className="text-sm font-bold text-slate-400 ml-1">{kpi.unit}</span>}
            </div>
            <p className="text-sm font-bold text-slate-700 mt-1">{kpi.label}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{kpi.englishLabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
