
import { AdData } from '../types';

/**
 * AIS API Service
 * LIVEモードにおける実データの取得や、外部システムとの連携を管理します。
 */

// 外部データソース（Google Apps Script）のエンドポイント
const LIVE_DATA_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxZAObtc-3QzSf1m7bVXlo7C0cqRSyvvLXPDHNq_9DlRrnYMJbqTe5S9xAg184imZU/exec';

/**
 * 外部APIから実データを取得します。
 * GAS等のバックエンドに蓄積されたSDKからの計測データをダッシュボード形式に変換して返します。
 */
export const fetchLiveAisData = async (): Promise<AdData[]> => {
    const response = await fetch(LIVE_DATA_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    // JSONかどうかをチェック
    let rawData;
    try {
      rawData = JSON.parse(responseText);
    } catch (e) {
      console.error('[AIS API] Received non-JSON response:', responseText.substring(0, 100));
      throw new Error(`Invalid JSON response from server. Starts with: ${responseText.substring(0, 20)}...`, { cause: e });
    }
    
    // GASからのレスポンスが配列でない場合のガード
    if (!rawData) return [];
    const dataArray = Array.isArray(rawData) ? rawData : (rawData.data || []);
    
    if (!Array.isArray(dataArray)) {
      console.error('[AIS API] Invalid data format received:', rawData);
      return [];
    }

    if (dataArray.length === 0) {
      return [];
    }

    const processedData = dataArray.map((item: any, index: number) => {
      if (!item) return null;
      const token = item.token || item.projectToken || '';
      const preset = item.preset || item.presetName || '';
      
      // プリセット名のマッピング
      const presetMap: Record<string, string> = {
        'video-demo': '動画広告（スキップ不可）',
        'popup-demo': '全画面ポップアップ',
        'banner-demo': 'サイドバーバナー',
        'sticky-demo': '追従型バナー',
        'forced-video': '強制視聴動画',
        'default': '標準計測広告'
      };

      // 名称の決定ロジック: 1.明示的な名前 2.マッピングされたプリセット名 3.トークン 4.デフォルト
      let adName = item.name || item.adName || '';
      if (!adName) {
        if (preset && presetMap[preset]) {
          adName = presetMap[preset];
        } else if (token) {
          // トークンをそのまま名称として使用（ユーザー要望）
          adName = token;
        } else {
          adName = '外部計測広告';
        }
      }
      
      const metrics = item.metrics || {};
      
      return {
        id: item.id || item.adId || token || `live-${index}-${Math.random().toString(36).substr(2, 5)}`,
        token: token,
        name: adName,
        type: item.type || item.adType || 'Video',
        events: Number(item.events) || 1,
        date: item.date || (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        timestamp: item.timestamp ? new Date(item.timestamp).getTime() : (item.date ? new Date(item.date).getTime() : Date.now()),
        frustration: Number(metrics.frustration || item.frustration) || ((metrics.isInterrupted || item.isInterrupted) ? 40 : 10),
        dropOff: Number(metrics.dropOff || item.dropOff) || 0,
        log: {
          duration: Number(metrics.duration || item.duration) || 15,
          occupancy: Number(metrics.occupancy || item.occupancy) || 0,
          volumeLevel: Number(metrics.volumeLevel || item.volumeLevel) || 0,
          isSticky: !!(metrics.isSticky || item.isSticky),
          isForced: !!(metrics.isForced || item.isForced),
          isInterrupted: !!(metrics.isInterrupted || item.isInterrupted),
          isAudioIntrusive: !!(metrics.isAudioIntrusive || item.isAudioIntrusive),
          continueAfterAd: metrics.continueAfterAd ?? item.continueAfterAd ?? true,
          noMute: metrics.noMute ?? item.noMute ?? false,
          noSkip: metrics.noSkip ?? item.noSkip ?? false,
          noLeave: metrics.noLeave ?? item.noLeave ?? true
        }
      };
    }).filter(Boolean) as AdData[];

    // タイムスタンプ順にソートして時系列処理を容易にする
    return processedData.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};
