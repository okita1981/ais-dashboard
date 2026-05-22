
import React, { useState } from 'react';
import { 
  HelpCircle, Mail, MessageSquare, ChevronRight, Send, X, 
  CheckCircle2, User, ChevronDown, FileText, Download, ArrowLeft 
} from 'lucide-react';

interface FaqItem {
  title: string;
  category: string;
  answer: string;
}

const HelpView: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [view, setView] = useState<'main' | 'docs'>('main');

  const faqs: FaqItem[] = [
    { 
      title: 'AISスコアの計算ロジックについて', 
      category: 'コア仕様',
      answer: 'AIS = Exposure(侵入量) × (1 / VAF(体験品質)) × 影響度係数 で算出されます。強制再生時間や割り込み回数など、ユーザーの時間を奪う要素が強いほどスコアは上昇（悪化）し、継続視聴やミュート解除などのポジティブな反応（VAF）が高いほどスコアは抑制されます。'
    },
    { 
      title: 'SDKの導入方法と初期設定', 
      category: 'エンジニア向け',
      answer: 'npm install @ais-impact/sdk を実行し、プロジェクトトークンを環境変数に設定してください。その後、アプリケーションのルートで initAIS() を呼び出すことで自動計測が開始されます。Reactの場合は App.tsx での初期化を推奨しています。'
    },
    { 
      title: 'プロジェクトトークンの再発行手順', 
      category: '管理設定',
      answer: '「システム設定」メニューの「計測タグの発行」セクションにある再発行ボタンから可能です。再発行すると古いトークンは即座に無効化されるため、SDK側のコードも同時に更新する必要があります。'
    },
    { 
      title: 'アラートの閾値カスタマイズ方法', 
      category: '運用',
      answer: '「設定」画面の「AIS基準値（Baseline）」スライダーを調整することで、どのアラート感度を全体的に変更できます。特定のアセット個別に設定する場合は、詳細分析画面から個別のアラート条件を設定可能です。'
    },
    { 
      title: '請求書の発行タイミングと支払い方法', 
      category: 'お支払い',
      answer: 'Proプラン以上の場合、毎月末締めで翌月3営業日以内にご登録のメールアドレスへPDF形式で送付されます。お支払いはクレジットカードまたは銀行振込がご利用いただけます。'
    },
  ];

  const documents = [
    { name: 'AIS 導入ガイドライン v2.4', size: '2.4 MB', date: '2024/05/01' },
    { name: '計算アルゴリズム詳細仕様書', size: '1.1 MB', date: '2024/04/15' },
    { name: 'メディア品質改善ベストプラクティス', size: '3.8 MB', date: '2024/05/12' },
    { name: 'プライバシーポリシー・データ取り扱い', size: '0.8 MB', date: '2024/01/20' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  if (view === 'docs') {
    return (
      <div className="max-w-4xl mx-auto py-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
        <button 
          onClick={() => setView('main')}
          className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm"
        >
          <ArrowLeft size={16} />
          <span>ヘルプトップへ戻る</span>
        </button>
        
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-2xl font-black text-slate-900">ドキュメントセンター</h2>
            <p className="text-slate-500 text-sm mt-1">各種マニュアルや技術仕様書をPDF形式でダウンロードいただけます。</p>
          </div>
          <div className="divide-y divide-slate-50">
            {documents.map((doc, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-400">最終更新: {doc.date} • {doc.size}</p>
                  </div>
                </div>
                <button className="flex items-center space-x-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                  <Download size={14} />
                  <span>ダウンロード</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900">ヘルプ & サポート</h2>
        <p className="text-slate-500 mt-2">ご不明な点がある場合は、こちらのリソースをご確認いただくか、直接お問い合わせください。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 h-fit">
          <div className="flex items-center space-x-3 mb-6">
            <HelpCircle className="text-blue-600" size={24} />
            <h3 className="text-lg font-bold">よくある質問 (FAQ)</h3>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-50 rounded-2xl overflow-hidden transition-all">
                <button 
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className={`w-full flex items-center justify-between p-4 transition-colors text-left ${openFaqIndex === i ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                >
                  <div className="pr-4">
                    <p className="text-[10px] font-bold text-blue-500 mb-1 uppercase tracking-widest">{faq.category}</p>
                    <p className="text-sm font-bold text-slate-700">{faq.title}</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 ${openFaqIndex === i ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                {openFaqIndex === i && (
                  <div className="p-4 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <button 
              onClick={() => setView('docs')}
              className="w-full text-center py-4 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>ドキュメントセンターを全て見る</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* Contact Section */}
        <div className="space-y-6">
          <section className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare size={32} />
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Available Now</span>
            </div>
            <h3 className="text-xl font-black">チャットで相談する</h3>
            <p className="text-sm opacity-80 mt-2 leading-relaxed">
              AISのエキスパートが、導入やスコア改善のアドバイスをリアルタイムで提供します。
            </p>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="mt-6 w-full bg-white text-blue-600 font-bold py-3 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              チャットを開始
            </button>
          </section>

          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Mail className="text-slate-400" size={24} />
              <h3 className="text-lg font-bold">メールでお問い合わせ</h3>
            </div>
            {submitted ? (
              <div className="py-10 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <p className="font-bold text-slate-900">お問い合わせを送信しました</p>
                <p className="text-xs text-slate-500 mt-2">通常24時間以内に担当者より返信いたします。</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Your Name</label>
                    <input type="text" required placeholder="お名前" className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input type="email" required placeholder="メールアドレス" className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Message / 内容</label>
                  <textarea required rows={4} placeholder="具体的な質問内容を入力してください" className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all"></textarea>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all flex items-center justify-center space-x-2 shadow-lg active:scale-95">
                  <Send size={16} />
                  <span>メッセージを送信</span>
                </button>
              </form>
            )}
          </section>

          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-500 mb-2">解決しない場合はこちら</p>
            <p className="text-sm font-bold text-slate-900 mb-4">公式サポート窓口</p>
            <a 
              href="mailto:support@ais-impact.jp" 
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-bold transition-colors"
            >
              <Mail size={16} />
              <span className="underline underline-offset-4">support@ais-impact.jp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Floating Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-bold leading-none">AIS Support Bot</p>
                <p className="text-[10px] opacity-80 mt-1 flex items-center italic">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="h-80 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            <div className="flex items-start space-x-3 max-w-[80%]">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700">
                こんにちは！AISサポートデスクです。何かお手伝いできることはありますか？
              </div>
            </div>
            <div className="flex items-start space-x-3 max-w-[80%] ml-auto flex-row-reverse space-x-reverse">
              <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none shadow-md text-sm text-white">
                SDKの導入でエラーが出ています。
              </div>
            </div>
            <div className="flex items-start space-x-3 max-w-[80%]">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700">
                承知いたしました。ブラウザのコンソールログを共有いただけますか？
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center space-x-2">
            <input type="text" placeholder="メッセージを入力..." className="flex-1 bg-slate-100 p-3 rounded-xl text-sm focus:outline-none" />
            <button className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 transition-transform active:scale-95">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpView;
