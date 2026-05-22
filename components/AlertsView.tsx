
import React from 'react';
import { AlertCircle, Clock, BellOff, ArrowRight, ShieldAlert } from 'lucide-react';

const AlertsView: React.FC = () => {
  const alerts = [
    { id: 'AL-992', title: '全画面ポップアップ A のAIS異常上昇', time: '12分前', level: 'Critical', asset: 'AD-001' },
    { id: 'AL-991', title: '動画広告 B の不快操作率 40% 超過', time: '1時間前', level: 'Warning', asset: 'AD-003' },
    { id: 'AL-989', title: '特定のドメインにおける離脱率の急増', time: '3時間前', level: 'Info', asset: 'Global' },
    { id: 'AL-988', title: '配信停止：基準値(Baseline)超過のため', time: '5時間前', level: 'Critical', asset: 'AD-010' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">アラート履歴</h2>
          <p className="text-slate-500 text-sm mt-1">システムによって自動検知された品質異常のログです。</p>
        </div>
        <button className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 transition-colors px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold">
          <BellOff size={16} />
          <span>通知をミュート</span>
        </button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
            <div className="flex items-center space-x-6">
              <div className={`p-4 rounded-2xl flex items-center justify-center ${
                alert.level === 'Critical' ? 'bg-red-50 text-red-600' : 
                alert.level === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {alert.level === 'Critical' ? <ShieldAlert size={24} /> : <AlertCircle size={24} />}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    alert.level === 'Critical' ? 'text-red-600' : 
                    alert.level === 'Warning' ? 'text-amber-600' : 'text-blue-600'
                  }`}>{alert.level}</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: {alert.id}</span>
                </div>
                <h4 className="font-bold text-slate-900 mt-1">{alert.title}</h4>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="flex items-center text-[10px] font-bold text-slate-400">
                    <Clock size={12} className="mr-1.5" />
                    {alert.time}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">対象：<span className="text-slate-600">{alert.asset}</span></span>
                </div>
              </div>
            </div>
            <button className="p-3 text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-2xl transition-all">
              <ArrowRight size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-10 text-center space-y-4">
        <h3 className="text-white font-black text-xl">すべてのアラートを監視中</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Slackやメールへのリアルタイム通知設定は「システム設定」メニューから構成可能です。
        </p>
      </div>
    </div>
  );
};

export default AlertsView;
