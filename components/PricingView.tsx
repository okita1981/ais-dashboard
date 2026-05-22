
import React from 'react';
import { Check, Shield, Zap, Globe, MessageCircle } from 'lucide-react';

const PricingView: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      price: '¥0',
      description: '個人のパブリッシャーや小規模サイト向け。',
      features: ['月間10万イベントまで計測', '基本AISスコアリング', 'ダッシュボード閲覧', 'コミュニティサポート'],
      buttonText: '現在のプラン',
      buttonClass: 'bg-slate-100 text-slate-400 cursor-not-allowed',
      highlight: false
    },
    {
      name: 'Pro',
      price: '¥19,800',
      description: '成長中のメディア企業やアドネットワーク向け。',
      features: ['イベント数無制限', '高度なAI予測分析', 'カスタム影響度係数', 'APIアクセス (REST)', '優先メールサポート'],
      buttonText: 'Proへアップグレード',
      buttonClass: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200',
      highlight: true
    },
    {
      name: 'Enterprise',
      price: '要お問い合わせ',
      description: '大規模プラットフォームやグローバル展開企業向け。',
      features: ['SLA 99.9%保証', '専用データレイク連携', 'マルチテナント管理', 'オンプレミス提供可', '専任マネージャーによる導入支援'],
      buttonText: 'お問い合わせ',
      buttonClass: 'bg-slate-900 text-white hover:bg-black',
      highlight: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AIS 料金プラン</h2>
        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
          メディアの信頼性とユーザー体験を最大化するための、最適なプランを選択してください。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div 
            key={i} 
            className={`bg-white rounded-3xl border p-8 flex flex-col transition-all duration-300 ${
              plan.highlight 
                ? 'border-blue-500 shadow-2xl shadow-blue-100 scale-105 z-10' 
                : 'border-slate-100 shadow-sm hover:shadow-xl'
            }`}
          >
            {plan.highlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-black tracking-tight">{plan.price}</span>
              {plan.price !== '要お問い合わせ' && <span className="text-slate-400 text-sm ml-1">/ 月</span>}
            </div>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">{plan.description}</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-start space-x-3 text-sm text-slate-600">
                  <Check className="text-blue-500 shrink-0 mt-0.5" size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button className={`mt-10 w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${plan.buttonClass}`}>
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-slate-100 pt-16">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Shield size={24} />
          </div>
          <h4 className="font-bold text-slate-900">強固なセキュリティ</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">全てのデータは暗号化され、安全に保護されます。</p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Zap size={24} />
          </div>
          <h4 className="font-bold text-slate-900">リアルタイム計測</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">ミリ秒単位でのイベント処理とスコアリングを実現。</p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Globe size={24} />
          </div>
          <h4 className="font-bold text-slate-900">グローバル対応</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">世界中のエッジサーバーでタグ配信と収集を行います。</p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <MessageCircle size={24} />
          </div>
          <h4 className="font-bold text-slate-900">24/7 サポート</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">エキスパートが広告品質の改善を24時間体制で支援。</p>
        </div>
      </div>
    </div>
  );
};

export default PricingView;
