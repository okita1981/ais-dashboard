
import React from 'react';
import { ShieldCheck, Globe, Settings2, CheckCircle } from 'lucide-react';

const IntegrityView: React.FC = () => {
  const mediaList = [
    { name: 'プレミアムポータル Y', domain: 'portal-y.com', status: 'Optimal', configs: 8 },
    { name: 'ニュースサイト Z', domain: 'news-z.jp', status: 'Warning', configs: 12 },
    { name: '動画アプリ X', domain: 'app-x.tv', status: 'Optimal', configs: 15 },
    { name: 'ライフスタイルブログ', domain: 'blog-life.com', status: 'Optimal', configs: 4 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">整合性管理</h2>
        <p className="text-slate-500 text-sm mt-1">配信先媒体ごとのAIS整合性と品質設定を管理します。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">媒体別インベントリ品質</h3>
            <button className="text-xs font-bold text-blue-600">新規追加</button>
          </div>
          <div className="divide-y divide-slate-50">
            {mediaList.map((media, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{media.name}</p>
                    <p className="text-xs text-slate-400">{media.domain}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Settings</p>
                    <p className="text-sm font-bold mt-1">{media.configs} Rules</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    media.status === 'Optimal' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {media.status}
                  </span>
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <Settings2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={28} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-black">オート・インテグリティ</h3>
            <p className="text-sm opacity-70 mt-4 leading-relaxed">
              AIが媒体の不快操作率を自動学習し、AISスコアが急騰した際に配信比率を自動抑制するインテリジェント機能です。
            </p>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle size={16} className="text-blue-400" />
              <span className="text-xs font-bold">自動バースト抑制：有効</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle size={16} className="text-blue-400" />
              <span className="text-xs font-bold">ドメイン別重み最適化：有効</span>
            </div>
            <button className="w-full bg-blue-600 py-3 rounded-2xl font-bold text-xs mt-4">詳細設定を開く</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrityView;
