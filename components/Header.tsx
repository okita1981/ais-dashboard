
import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail = 'okita@ais.standard.com', onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayName = "沖田 紘亮";
  const displayRole = "ADMINISTRATOR";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { 
      id: 1, 
      title: '【警告】AISスコア上昇', 
      desc: '全画面ポップアップAのAISスコアが閾値(250)を超えました。', 
      time: '10分前', 
      type: 'warning',
      icon: <span className="text-amber-500 text-sm">⚠️</span>
    },
    { 
      id: 2, 
      title: 'レポート生成完了', 
      desc: '先週のメディア品質改善レポートが正常に生成されました。', 
      time: '2時間前', 
      type: 'info',
      icon: <span className="text-blue-500 text-sm">📄</span>
    },
    { 
      id: 3, 
      title: 'システムアップデート', 
      desc: 'SDK v2.1.0がリリースされました。最新機能が利用可能です。', 
      time: '5時間前', 
      type: 'success',
      icon: <span className="text-emerald-500 text-sm">✅</span>
    }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="relative w-full max-w-md hidden md:block">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="h-4 w-4 text-slate-400">🔍</span>
        </span>
        <input
          type="text"
          placeholder="広告ID、キャンペーン名を検索..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="flex items-center space-x-4">
        {/* 通知ベル */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-2 rounded-full transition-colors relative ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            <span className="text-xl">🔔</span>
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</span>
                <button 
                  onClick={() => { alert('全ての通知を既読にしました'); setIsNotifOpen(false); }}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  全て既読にする
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => alert(`${n.title} を開きました`)}
                    className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex space-x-3">
                      <div className="mt-0.5">{n.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{n.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-slate-50/50 text-center">
                <button 
                  onClick={() => alert('通知一覧ページへ移動します')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  過去の通知を全て見る
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        {/* ユーザーメニュー */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-3 pl-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-sm ring-2 ring-transparent group-hover:ring-blue-200 transition-all">
              <span className="text-sm">👤</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">{displayName}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">{displayRole}</p>
            </div>
            <span className={`text-xs text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <p className="text-xs text-slate-400">ログイン中</p>
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
              </div>
              <button className="w-full flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                <span className="mr-3">👤</span>
                プロフィール
              </button>
              <button className="w-full flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                <span className="mr-3">⚙️</span>
                個人設定
              </button>
              <button className="w-full flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                <span className="mr-3">💳</span>
                請求情報
              </button>
              <div className="border-t border-slate-50 mt-1 pt-1">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="mr-3">🚪</span>
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
