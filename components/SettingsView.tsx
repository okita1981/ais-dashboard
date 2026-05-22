
import React, { useState } from 'react';
import { AisWeights } from '../types';
import { Sliders, RefreshCcw, ShieldCheck, AlertCircle, Code, Copy, Check, Play, Info } from 'lucide-react';

interface SettingsViewProps {
  weights: AisWeights;
  onWeightChange: (key: keyof AisWeights, value: number) => void;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  weights: {
    force: number;
    interrupt: number;
    audio: number;
  };
  icon: React.ReactNode;
}

const SettingsView: React.FC<SettingsViewProps> = ({ weights, onWeightChange }) => {
  const [copied, setCopied] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('video-nonskip');
  const [activeClient, setActiveClient] = useState('Client A');
  const [projectToken, setProjectToken] = useState((import.meta as any).env?.VITE_AIS_PROJECT_TOKEN || "ais-proj-8829-x921");
  
  const clients = ['Client A', 'Client B', 'Client C', 'Client D'];

  const presets: Preset[] = [
    {
      id: 'video-nonskip',
      name: '動画広告 (スキップ不可)',
      description: '強制視聴と行動割り込みが最大化される、ブランド認知向けの高侵入設定。',
      weights: { force: 3.5, interrupt: 2.0, audio: 1.8 },
      icon: <Play size={18} />
    },
    {
      id: 'video-skip',
      name: '動画広告 (スキップ可)',
      description: '標準的な動画広告。ユーザーの選択肢を残しつつ、視聴完了を重視。',
      weights: { force: 1.5, interrupt: 1.5, audio: 1.3 },
      icon: <RefreshCcw size={18} />
    },
    {
      id: 'popup-intruder',
      name: '全画面ポップアップ',
      description: '行動を完全に中断させる設定。CVRは高いが離脱リスクも最大。',
      weights: { force: 2.5, interrupt: 3.0, audio: 1.0 },
      icon: <ShieldCheck size={18} />
    },
    {
      id: 'native-banner',
      name: 'ネイティブ / バナー',
      description: 'コンテンツに馴染む低侵入設定。長期的なユーザー保持に適しています。',
      weights: { force: 1.0, interrupt: 1.0, audio: 1.0 },
      icon: <Info size={18} />
    }
  ];

  const activePreset = presets.find(p => p.id === selectedPresetId) || presets[0];
  const snippet = `<script src="${window.location.origin}/ais-sdk.js" 
  data-token="${projectToken}" 
  data-client="${activeClient.toLowerCase().replace(' ', '-')}"
  data-preset="${selectedPresetId}" 
  data-init-force="${activePreset.weights.force}"
></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReissue = () => {
    const newToken = `ais-proj-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6)}`;
    setProjectToken(newToken);
  };

  const applyPresetToSystem = () => {
    onWeightChange('force', activePreset.weights.force);
    onWeightChange('interrupt', activePreset.weights.interrupt);
    onWeightChange('audio', activePreset.weights.audio);

    console.log('[AIS Settings] Preset applied to dashboard:', activePreset.name);
  };

  const settings = [
    { key: 'force' as const, label: '強制再生の影響度係数', sub: 'force_impact_factor', min: 1, max: 5, step: 0.1, desc: 'ユーザーに強制的に視聴させる場合の影響度係数。' },
    { key: 'interrupt' as const, label: '行動割り込みの影響度係数', sub: 'interrupt_impact_factor', min: 1, max: 5, step: 0.1, desc: '本来の閲覧フローを中断させる場合の影響度係数。' },
    { key: 'audio' as const, label: '音声侵入の影響度係数', sub: 'audio_impact_factor', min: 1, max: 5, step: 0.1, desc: 'ユーザーの許可なく音声が再生される場合の影響度係数。' },
    { key: 'baseline' as const, label: 'AIS基準値', sub: 'baseline', min: 10, max: 100, step: 1, desc: '「良質な体験」のターゲット閾値。' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">システム設定</h2>
          <p className="text-slate-500 text-sm mt-1">AIS算出ロジックの調整と、外部計測タグの管理を行います。</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              onWeightChange('force', 1.7);
              onWeightChange('interrupt', 1.5);
              onWeightChange('audio', 1.3);
              onWeightChange('baseline', 30);
            }}
            className="flex items-center space-x-2 text-[#45A29E] hover:bg-[#45A29E]/5 transition-all bg-white px-4 py-2 rounded-xl border border-[#45A29E]/20 shadow-sm"
          >
            <ShieldCheck size={16} />
            <span className="text-xs font-bold">デフォルト設定</span>
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 text-slate-400 hover:text-[#45A29E] transition-colors bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
          >
            <RefreshCcw size={16} />
            <span className="text-xs font-bold">リセット</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden ring-1 ring-slate-200/50">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#45A29E]/10 text-[#45A29E] rounded-xl">
              <Code size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">計測タグの発行</h3>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mt-1">Tag Generation & SDK Setup</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-1 text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>ENDPOINTS ACTIVE</span>
            </div>
            <button 
              onClick={handleReissue}
              className="flex items-center space-x-2 text-xs font-bold text-[#45A29E] hover:text-[#3d8f8b] transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm"
            >
              <RefreshCcw size={14} />
              <span>更新（再発行）</span>
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-900">1. クライアント / プロジェクト選択</p>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {clients.map(client => (
                  <button
                    key={client}
                    onClick={() => setActiveClient(client)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeClient === client ? 'bg-white text-[#45A29E] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {client}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900 mb-4">2. 広告種別のプリセット選択</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`flex items-start p-4 rounded-2xl border-2 transition-all text-left group ${
                    selectedPresetId === preset.id
                      ? 'border-[#45A29E] bg-[#45A29E]/5 shadow-md ring-4 ring-[#45A29E]/10'
                      : 'border-slate-100 bg-white hover:border-[#45A29E]/30 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-3 rounded-xl mr-4 transition-colors ${
                    selectedPresetId === preset.id ? 'bg-[#45A29E] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#45A29E]/10 group-hover:text-[#45A29E]'
                  }`}>
                    {preset.icon}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${selectedPresetId === preset.id ? 'text-[#45A29E]' : 'text-slate-900'}`}>{preset.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-900">3. JavaScriptスニペット</p>
              <button 
                onClick={applyPresetToSystem}
                className="text-[10px] font-bold text-[#45A29E] hover:text-[#3d8f8b] bg-[#45A29E]/5 px-3 py-1 rounded-full transition-colors border border-[#45A29E]/10"
              >
                このプリセットをダッシュボードに適用
              </button>
            </div>
            
            <div className="relative group">
              <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm text-[#64FFDA] overflow-x-auto whitespace-pre leading-relaxed shadow-inner border border-slate-800">
                {snippet}
              </div>
              <button 
                onClick={handleCopy}
                className="absolute right-4 top-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-md transition-all flex items-center space-x-2 border border-white/10 shadow-lg group-hover:scale-105 active:scale-95"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center space-x-3">
          <div className="p-2 bg-[#45A29E]/10 text-[#45A29E] rounded-lg">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">グローバル・インパクト係数管理</h3>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Global Impact Factors Management</p>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-[#45A29E]/5 rounded-2xl p-6 mb-10 border border-[#45A29E]/10 flex items-start space-x-4 shadow-sm">
            <Info className="text-[#45A29E] shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-[#45A29E] leading-relaxed font-medium">
              本設定では、媒体やコンテンツの性質（文脈）に応じて、ユーザー体験に与える各要素の影響度を調整します。数値が高いほど、その要素がAISスコアに厳しく反映されます。
            </p>
          </div>

          <div className="space-y-12">
            {settings.map((s) => (
              <div key={s.key} className="group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">{s.label}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500">{s.sub}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">{s.desc}</p>
                  </div>
                  <div className="flex items-center space-x-4 bg-[#45A29E]/5 px-4 py-2 rounded-2xl border border-[#45A29E]/10">
                    <div className="text-right min-w-[60px]">
                      <span className="text-3xl font-black text-[#45A29E] tabular-nums">
                        {weights[s.key].toFixed(s.key === 'baseline' ? 0 : 1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <span className="text-[10px] font-black text-slate-300 w-8">MIN {s.min}</span>
                  <div className="relative flex-1 h-6 flex items-center">
                    <div className="absolute inset-0 h-2 bg-slate-100 rounded-full my-auto"></div>
                    <div 
                      className="absolute inset-y-0 h-2 bg-[#45A29E] rounded-full my-auto transition-all duration-150"
                      style={{ width: `${((weights[s.key] - s.min) / (s.max - s.min)) * 100}%` }}
                    ></div>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={weights[s.key]}
                      onChange={(e) => onWeightChange(s.key, parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer accent-[#45A29E] focus:outline-none z-10"
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 w-8 text-right">MAX {s.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
