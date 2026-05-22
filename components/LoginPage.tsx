
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 認証データの定義
    const VALID_EMAIL = 'aisleaio@gmail.com';
    const VALID_PASSWORD = 'ais2026';

    setTimeout(() => {
      if (email.toLowerCase() === VALID_EMAIL.toLowerCase() && password === VALID_PASSWORD) {
        onLogin(email);
      } else {
        setError('メールアドレスまたはパスワードが正しくありません');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#45A29E]/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm">
          <div className="p-8 md:p-10">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-[#45A29E] rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-[#45A29E]/20 mb-4">
                A
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AIS Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">Attention Integrity Standard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 group-focus-within:text-[#45A29E] transition-colors">📧</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#45A29E]/20 focus:border-[#45A29E] transition-all"
                    placeholder="aisleaio@gmail.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 group-focus-within:text-[#45A29E] transition-colors">🔒</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#45A29E]/20 focus:border-[#45A29E] transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-1">
                  <span className="shrink-0">⚠️</span>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#45A29E] hover:bg-[#3d8f8b] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#45A29E]/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>ログイン</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">
              © 2026 Attention Integrity Standard. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
