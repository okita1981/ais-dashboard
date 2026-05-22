
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';
import AnalysisView from './components/AnalysisView';
import IntegrityView from './components/IntegrityView';
import AlertsView from './components/AlertsView';
import HelpView from './components/HelpView';
import PricingView from './components/PricingView';
import DemoPage from './components/DemoPage';
import LoginPage from './components/LoginPage';
import { DEFAULT_WEIGHTS, calculateExposure, calculateVAF, calculateAIS, calculateIntegrityScore, getAISStatus } from './logic';
import { AisWeights, AdData } from './types';
import { MOCK_AD_DATA } from './constants';
import { fetchLiveAisData, fetchDashboardData, DashboardData } from './services/api';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weights, setWeights] = useState<AisWeights>(DEFAULT_WEIGHTS);
  const [ads, setAds] = useState<AdData[]>(MOCK_AD_DATA);
  const [liveHistory, setLiveHistory] = useState<AdData[]>([]);
  const [liveDashboard, setLiveDashboard] = useState<DashboardData | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<'demo' | 'live'>('demo');
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState('直近30日間');
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // 期間選択に応じたデータシミュレーション
  useEffect(() => {
    if (dataMode === 'live') return;

    let multiplier = 1;
    switch (selectedRange) {
      case '今日': multiplier = 0.1; break;
      case '直近7日間': multiplier = 0.3; break;
      case '直近30日間': multiplier = 1.0; break;
      case '今月': multiplier = 0.9; break;
      default: multiplier = 1.0;
    }

    const simulatedAds = MOCK_AD_DATA.map(ad => ({
      ...ad,
      events: Math.floor(ad.events * multiplier * (0.8 + Math.random() * 0.4)),
      log: {
        ...ad.log,
        duration: Math.max(5, Math.floor(ad.log.duration * (0.9 + Math.random() * 0.2)))
      }
    }));
    setAds(simulatedAds);
  }, [selectedRange, dataMode]);

  // Live Mode data fetching — pulls from Supabase via /api/dashboard
  const fetchLiveData = async () => {
    if (dataMode !== 'live') return;
    setIsLiveLoading(true);
    setLiveError(null);
    console.log('%c🔄 [LIVE] Supabaseから最新データを再取得中...', 'color: #45A29E; font-weight: bold;');

    try {
      // Fetch aggregated dashboard data first (authoritative source of truth)
      const dashboard = await fetchDashboardData(
        selectedRange === '今日' ? '24h' :
        selectedRange === '直近7日間' ? '7d' :
        selectedRange === '直近30日間' ? '30d' :
        'all'
      );
      setLiveDashboard(dashboard);

      const liveAds = await fetchLiveAisData();

      if (!liveAds || liveAds.length === 0) {
        console.warn('%c[LIVE] 取得されたデータが空です。', 'color: orange; font-weight: bold;');
      }

      // Force state update by creating a new array reference
      const newData = [...liveAds];
      setLiveHistory(newData);
      
      // Aggregate data by token for the Dashboard list
      const aggregatedMap = new Map<string, AdData>();
      
      newData.forEach(ad => {
        const key = ad.token || ad.id;

        // If avgScore is already set by /api/dashboard (Supabase aggregates),
        // trust it as authoritative. Otherwise recalculate from log fields.
        let score: number;
        if (typeof ad.avgScore === 'number') {
          score = ad.avgScore;
        } else {
          const exp = calculateExposure(
            ad.log.duration,
            Number(ad.log.occupancy) || 0,
            Number(ad.log.volumeLevel) || 0,
            ad.log.isSticky || false,
            ad.log.isForced,
            ad.log.isInterrupted,
            ad.log.isAudioIntrusive,
            weights
          );
          const vaf = calculateVAF(ad.log.continueAfterAd, ad.log.noMute, ad.log.noSkip, ad.log.noLeave);
          score = calculateAIS(exp, vaf);
        }
        
        if (!aggregatedMap.has(key)) {
          aggregatedMap.set(key, { 
            ...ad, 
            name: ad.token || ad.id, // Ensure token is used as name in LIVE mode
            events: 1, 
            allScores: [score] 
          });
        } else {
          const existing = aggregatedMap.get(key)!;
          existing.events = (existing.events || 0) + 1;
          if (!existing.allScores) existing.allScores = [];
          existing.allScores.push(score);
        }
      });

      const aggregatedAds = Array.from(aggregatedMap.values()).map(ad => {
        if (ad.allScores && ad.allScores.length > 0) {
          ad.avgScore = ad.allScores.reduce((a: number, b: number) => a + b, 0) / ad.allScores.length;
        } else {
          ad.avgScore = ad.latestScore || 0;
        }
        return ad;
      });

      setAds([...aggregatedAds]);
      console.log(`%c✅ [LIVE] 同期完了: ${newData.length} 件のイベントを処理しました。`, 'color: #45A29E;');
    } catch (error: any) {
      console.error('%c❌ [LIVE FETCH ERROR] データの取得に失敗しました。', 'color: red; font-weight: bold;');
      console.error('%c理由:', 'color: red;', error.message || error);
      if (error.stack) console.error('%cスタックトレース:', 'color: red; font-size: 10px;', error.stack);
      setLiveError(error.message || String(error));
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Handle mode switch and Polling (60s)
  useEffect(() => {
    let interval: any = null;

    if (dataMode === 'demo') {
      setAds(MOCK_AD_DATA);
      setLiveHistory([]);
      setLiveDashboard(null);
      setLiveError(null);
    } else {
      // Clear ads immediately when switching to live to avoid showing demo data
      setAds([]);
      setLiveHistory([]);
      fetchLiveData();
      // Poll every 10s for fresher updates (was 60s with GAS)
      interval = setInterval(() => {
        fetchLiveData();
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dataMode]);

  // 認証チェック
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('ais_auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (authData?.isLoggedIn) {
          setUserEmail(authData.email || 'aisleaio@gmail.com');
          setIsLoggedIn(true);
        }
      }
    } catch (e) {
      console.error('Auth error', e);
    }
  }, []);

  const handleLogin = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('ais_auth', JSON.stringify({ email, isLoggedIn: true }));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    localStorage.removeItem('ais_auth');
  };

  const handleWeightChange = (key: keyof AisWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            weights={weights}
            ads={ads}
            liveHistory={liveHistory}
            liveDashboard={liveDashboard}
            liveError={liveError}
            dataMode={dataMode}
            setDataMode={setDataMode}
            isLiveLoading={isLiveLoading}
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
          />
        );
      case 'settings':
        return <SettingsView weights={weights} onWeightChange={handleWeightChange} />;
      case 'analysis':
        return <AnalysisView weights={weights} ads={ads} liveHistory={liveHistory} dataMode={dataMode} setDataMode={setDataMode} />;
      case 'integrity':
        return <IntegrityView />;
      case 'alerts':
        return <AlertsView />;
      case 'help':
        return <HelpView />;
      case 'pricing':
        return <PricingView />;
      case 'demo':
        return <DemoPage weights={weights} />;
      default:
        return (
          <Dashboard
            weights={weights}
            ads={ads}
            liveHistory={liveHistory}
            liveDashboard={liveDashboard}
            liveError={liveError}
            dataMode={dataMode}
            setDataMode={setDataMode}
            isLiveLoading={isLiveLoading}
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
          />
        );
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header userEmail={userEmail} onLogout={handleLogout} />
        <main className="p-6 md:p-8 flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
