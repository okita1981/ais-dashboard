
import React from 'react';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col flex-shrink-0">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">
          A
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">AIS</h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Attention Integrity</p>
        </div>
      </div>

      <nav className="flex-1 mt-4 px-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className={`${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
              {item.icon}
            </span>
            <div className="ml-3 text-left">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className={`text-[10px] ${activeTab === item.id ? 'text-blue-400' : 'text-slate-400'}`}>
                {item.english}
              </p>
            </div>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-br from-blue-600 to-sky-600 rounded-2xl p-4 text-white shadow-xl shadow-blue-100">
          <p className="text-xs font-semibold opacity-80 uppercase">Free Plan</p>
          <p className="mt-1 font-bold text-sm">Pro版へアップグレード</p>
          <p className="text-[10px] mt-2 opacity-90 leading-relaxed">
            高度なAI予測とレポート共有機能が利用可能になります。
          </p>
          <button 
            onClick={() => onTabChange('pricing')}
            className="mt-3 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg text-xs font-bold transition-colors"
          >
            詳細を見る
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
