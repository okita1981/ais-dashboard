
import React from 'react';
import { AdData, ChartDataPoint } from './types';
import { LayoutDashboard, BarChart3, Settings, ShieldCheck, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', icon: <span>📊</span>, label: 'ダッシュボード', english: 'Dashboard' },
  { id: 'demo', icon: <span>🔗</span>, label: 'デモサイト表示', english: 'Live Demo Site' },
  { id: 'analysis', icon: <span>📈</span>, label: '詳細分析', english: 'Analytics' },
  { id: 'integrity', icon: <span>🛡️</span>, label: '整合性管理', english: 'Integrity' },
  { id: 'alerts', icon: <span>⚠️</span>, label: 'アラート', english: 'Alerts' },
  { id: 'settings', icon: <span>⚙️</span>, label: '設定', english: 'Settings' },
  { id: 'help', icon: <span>❓</span>, label: 'ヘルプ', english: 'Support' },
];

export const MOCK_AD_DATA: AdData[] = [
  { 
    id: 'AD-001', name: '全画面ポップアップ A', type: 'Popup', 
    log: { duration: 30, isForced: true, isInterrupted: true, isAudioIntrusive: true, continueAfterAd: false, noMute: false, noSkip: false, noLeave: false },
    events: 5200, date: '2024-05-10' 
  },
  { 
    id: 'AD-002', name: 'ネイティブ記事 B', type: 'Native', 
    log: { duration: 30, isForced: false, isInterrupted: false, isAudioIntrusive: false, continueAfterAd: true, noMute: true, noSkip: true, noLeave: true },
    events: 15600, date: '2024-05-10' 
  },
  { 
    id: 'AD-003', name: '自動再生動画 X', type: 'Video', 
    log: { duration: 15, isForced: true, isInterrupted: false, isAudioIntrusive: true, continueAfterAd: false, noMute: false, noSkip: true, noLeave: true },
    events: 8900, date: '2024-05-09' 
  },
  { 
    id: 'AD-004', name: 'サイドバーバナー', type: 'Banner', 
    log: { duration: 10, isForced: false, isInterrupted: false, isAudioIntrusive: false, continueAfterAd: true, noMute: true, noSkip: true, noLeave: true },
    events: 12400, date: '2024-05-09' 
  },
  { 
    id: 'AD-005', name: 'リワード動画 Y', type: 'Video', 
    log: { duration: 20, isForced: false, isInterrupted: false, isAudioIntrusive: true, continueAfterAd: true, noMute: true, noSkip: true, noLeave: true },
    events: 21000, date: '2024-05-08' 
  },
  { 
    id: 'AD-006', name: '追従バナー C', type: 'Banner', 
    log: { duration: 45, isForced: false, isInterrupted: true, isAudioIntrusive: false, continueAfterAd: false, noMute: true, noSkip: false, noLeave: true },
    events: 11200, date: '2024-05-08' 
  },
  { 
    id: 'AD-007', name: 'ニュースフィード D', type: 'Native', 
    log: { duration: 12, isForced: false, isInterrupted: false, isAudioIntrusive: false, continueAfterAd: true, noMute: true, noSkip: true, noLeave: true },
    events: 18900, date: '2024-05-07' 
  },
  { 
    id: 'AD-008', name: '離脱意図ポップアップ', type: 'Popup', 
    log: { duration: 5, isForced: true, isInterrupted: true, isAudioIntrusive: false, continueAfterAd: false, noMute: true, noSkip: false, noLeave: false },
    events: 3400, date: '2024-05-07' 
  },
  { 
    id: 'AD-009', name: 'プレミアム動画 Z', type: 'Video', 
    log: { duration: 30, isForced: false, isInterrupted: false, isAudioIntrusive: false, continueAfterAd: true, noMute: true, noSkip: true, noLeave: true },
    events: 7600, date: '2024-05-06' 
  },
  { 
    id: 'AD-010', name: 'オーバーレイバナー', type: 'Banner', 
    log: { duration: 25, isForced: true, isInterrupted: false, isAudioIntrusive: false, continueAfterAd: false, noMute: true, noSkip: false, noLeave: true },
    events: 9800, date: '2024-05-06' 
  },
];

export const CHART_DATA: ChartDataPoint[] = [
  { time: '09:00', score: 120, events: 450 },
  { time: '10:00', score: 145, events: 580 },
  { time: '11:00', score: 110, events: 720 },
  { time: '12:00', score: 85, events: 890 },
  { time: '13:00', score: 92, events: 650 },
  { time: '14:00', score: 150, events: 590 },
  { time: '15:00', score: 210, events: 920 },
  { time: '16:00', score: 180, events: 810 },
  { time: '17:00', score: 95, events: 1100 },
  { time: '18:00', score: 60, events: 1400 },
];
