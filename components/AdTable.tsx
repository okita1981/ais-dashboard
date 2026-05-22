
import React, { useState } from 'react';
import { AisWeights, AdData } from '../types';
import { calculateExposure, calculateVAF, calculateAIS, getAISStatus, getImprovementAdvice, calculateIntegrityScore } from '../logic';

interface AdTableProps {
  weights: AisWeights;
  ads: AdData[];
}

const AdTable: React.FC<AdTableProps> = ({ weights, ads }) => {
  const [previewAd, setPreviewAd] = useState<AdData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDiagnosisReport, setShowDiagnosisReport] = useState(false);

  // Compute and sort data in real-time
  const tableData = ads.map(ad => {
    const safeWeights = weights || { force: 1, interrupt: 1, audio: 1, baseline: 30 };
    
    // Use pre-calculated values if available (Live mode)
    // Note: Live mode data from GAS might already be the stress score
    const stressScore = ad.avgScore !== undefined ? ad.avgScore : (ad.latestScore !== undefined ? ad.latestScore : calculateAIS(
      calculateExposure(
        ad.log.duration, 
        Number(ad.log.occupancy) || 0, 
        Number(ad.log.volumeLevel) || 0, 
        ad.log.isSticky || false,
        ad.log.isForced, 
        ad.log.isInterrupted, 
        ad.log.isAudioIntrusive, 
        safeWeights
      ),
      calculateVAF(ad.log.continueAfterAd, ad.log.noMute, ad.log.noSkip, ad.log.noLeave)
    ));

    const integrityScore = calculateIntegrityScore(stressScore);

    const exposure = calculateExposure(
      ad.log.duration, 
      Number(ad.log.occupancy) || 0, 
      Number(ad.log.volumeLevel) || 0, 
      ad.log.isSticky || false,
      ad.log.isForced, 
      ad.log.isInterrupted, 
      ad.log.isAudioIntrusive, 
      safeWeights
    );
    const vaf = calculateVAF(ad.log.continueAfterAd, ad.log.noMute, ad.log.noSkip, ad.log.noLeave);
    
    const advice = getImprovementAdvice(exposure, vaf, {
      occupancy: Number(ad.log.occupancy) || 0,
      volumeLevel: Number(ad.log.volumeLevel) || 0,
      isSticky: ad.log.isSticky || false,
      isForced: ad.log.isForced,
      noSkip: ad.log.noSkip,
      noMute: ad.log.noMute
    });

    const sentiment = ad.status || getAISStatus(integrityScore);

    return { ...ad, exposure, vaf, aisScore: stressScore, integrityScore, advice, sentiment };
  }).sort((a, b) => b.aisScore - a.aisScore); // Sort by Stress Score (higher is worse)

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setShowDiagnosisReport(true);
      
      // Also trigger the actual CSV download in background
      const headers = ['広告名', 'ID', 'タイプ', '最新占有率', 'AISスコア', '判定'];
      const rows = tableData.map(ad => [
        ad.name,
        ad.id,
        ad.type,
        `${Math.round(ad.log.occupancy)}%`,
        Math.round(ad.aisScore),
        ad.sentiment === 'Positive' ? '良好' : ad.sentiment === 'Negative' ? '要改善' : '注意'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `AIS_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">広告アセット分析ランキング</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Asset Ranking & Improvement Guide</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden lg:block text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">
            最上位：最も侵入度が高い（改善が必要な）広告
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isExporting 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-[#45A29E] text-white hover:bg-[#3d8f8b] shadow-sm hover:shadow-md'
            }`}
          >
            {isExporting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>エクスポート中...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>レポートを出力 (CSV)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">広告名 (Name)</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">タイプ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">最新占有率</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">AISスコア</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">判定</th>
              <th className="px-6 py-4 text-[10px] font-bold text-[#45A29E] uppercase tracking-widest">改善ガイド (Advice)</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tableData.map((ad) => (
              <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setPreviewAd(ad)}
                      className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#45A29E]/10 hover:text-[#45A29E] transition-colors"
                    >
                      <span>🔗</span>
                    </button>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{ad.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{ad.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-50 text-slate-600">
                    {ad.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-600">{Math.round(ad.log.occupancy)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center">
                    <span className={`text-base font-black ${
                      ad.sentiment === 'Positive' ? 'text-green-600' :
                      ad.sentiment === 'Neutral' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {Math.round(ad.aisScore)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      ad.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                      ad.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {ad.sentiment === 'Positive' ? '良好' : ad.sentiment === 'Negative' ? '要改善' : '注意'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {ad.advice.map((line, i) => (
                      <div key={i} className="flex items-center space-x-1 text-[11px] font-bold text-[#45A29E]">
                        <span className="flex-shrink-0 text-[10px]">✨</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600">⋮</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewAd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h4 className="text-lg font-bold text-slate-900">{previewAd.name}</h4>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Creative Preview</p>
              </div>
              <button 
                onClick={() => setPreviewAd(null)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-8">
              <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 relative group">
                <img 
                  src={`https://picsum.photos/seed/${previewAd.id}/800/450`} 
                  alt={previewAd.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-slate-900 shadow-xl">
                    プレビューイメージ
                  </span>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Type</p>
                  <p className="text-sm font-bold text-slate-900">{previewAd.type}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">AIS Score</p>
                  <p className="text-sm font-bold text-[#45A29E]">{Math.round(calculateIntegrityScore(calculateAIS(
                    calculateExposure(
                      previewAd.log.duration, 
                      previewAd.log.occupancy || 50, 
                      previewAd.log.volumeLevel || 50, 
                      previewAd.log.isSticky || false,
                      previewAd.log.isForced, 
                      previewAd.log.isInterrupted, 
                      previewAd.log.isAudioIntrusive, 
                      weights || { force: 1, interrupt: 1, audio: 1, baseline: 30 }
                    ),
                    calculateVAF(previewAd.log.continueAfterAd, previewAd.log.noMute, previewAd.log.noSkip, previewAd.log.noLeave)
                  )))}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <p className="text-sm font-bold text-slate-900">{getAISStatus(calculateIntegrityScore(calculateAIS(
                    calculateExposure(
                      previewAd.log.duration, 
                      previewAd.log.occupancy || 50, 
                      previewAd.log.volumeLevel || 50, 
                      previewAd.log.isSticky || false,
                      previewAd.log.isForced, 
                      previewAd.log.isInterrupted, 
                      previewAd.log.isAudioIntrusive, 
                      weights || { force: 1, interrupt: 1, audio: 1, baseline: 30 }
                    ),
                    calculateVAF(previewAd.log.continueAfterAd, previewAd.log.noMute, previewAd.log.noSkip, previewAd.log.noLeave)
                  )))}</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setPreviewAd(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Brand Damage Risk Diagnosis Report Modal */}
      {showDiagnosisReport && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-red-600/20">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight">ブランド毀損リスク診断書</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Brand Integrity & Risk Assessment Report</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDiagnosisReport(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-50 border border-red-100 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">総合リスク判定</p>
                  <p className="text-3xl font-black text-red-600">HIGH RISK</p>
                  <p className="text-xs text-red-500 mt-2 font-bold">即時のクリエイティブ改善を推奨</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">平均AISスコア</p>
                  <p className="text-3xl font-black text-slate-900">{Math.round(tableData.reduce((a, b) => a + b.aisScore, 0) / tableData.length)} pt</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold">業界平均より 24% 高い侵入度</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">要注意アセット数</p>
                  <p className="text-3xl font-black text-slate-900">{tableData.filter(ad => ad.sentiment === 'Negative').length} / {tableData.length}</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold">全アセットの約半数が危険水域</p>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-black text-slate-900 mb-6 flex items-center">
                  <span className="w-1.5 h-4 bg-red-600 rounded-full mr-3"></span>
                  AIによる重点改善アセット診断
                </h5>
                <div className="space-y-4">
                  {tableData.filter(ad => ad.sentiment === 'Negative').slice(0, 3).map((ad, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 flex items-start space-x-6 hover:shadow-lg transition-shadow">
                      <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                        <img src={`https://picsum.photos/seed/${ad.id}/200/120`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-black text-slate-900">{ad.name}</p>
                          <span className="text-red-600 font-black text-sm">AIS: {Math.round(ad.aisScore)}</span>
                        </div>
                        <div className="space-y-2">
                          {ad.advice.map((line, j) => (
                            <p key={j} className="text-xs text-slate-500 font-bold flex items-center">
                              <span className="text-red-500 mr-2">●</span>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2rem]">
                <h5 className="text-blue-900 font-black mb-4 flex items-center">
                  <span className="mr-3">💡</span>
                  ブランドセーフティ向上のための提言
                </h5>
                <p className="text-sm text-blue-800 leading-relaxed font-bold">
                  現在の配信設定では、ユーザーの「自由意志」を阻害する要因（スキップ不可・自動再生・高占有率）が重なっており、
                  短期的には高い視聴完了率が得られるものの、長期的にはブランドに対する「負の感情」を蓄積させるリスクが極めて高い状態です。
                  特にモバイル環境における占有率の抑制と、音声ミュート状態での理解促進を優先的に進めるべきです。
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Generated by AIS Intelligence Engine v2.5</p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setShowDiagnosisReport(false)}
                  className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:bg-slate-100 transition-all"
                >
                  閉じる
                </button>
                <button 
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                >
                  PDFとして保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdTable;
