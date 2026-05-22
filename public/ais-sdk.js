
(function() {
  /**
   * AIS (Attention Integrity Standard) SDK
   * 広告の視認性、音量、ユーザー体験をリアルタイム計測します。
   */
  const scriptTag = document.currentScript;
  const token = scriptTag?.getAttribute('data-token') || 'ais-debug-token';
  const selector = scriptTag?.getAttribute('data-selector') || '.ais-ad';
  const preset = scriptTag?.getAttribute('data-preset') || 'default';
  
  // Impact Factors from settings
  const forceWeight = parseFloat(scriptTag?.getAttribute('data-force') || '1.7');
  const interruptWeight = parseFloat(scriptTag?.getAttribute('data-interrupt') || '1.5');
  const audioWeight = parseFloat(scriptTag?.getAttribute('data-audio') || '1.3');
  
  console.log('[AIS SDK] 🚀 SDK Initializing...');
  console.log(`[AIS SDK] 設定: Token=${token}, Selector=${selector}, Weights=[F:${forceWeight}, I:${interruptWeight}, A:${audioWeight}]`);
  if (!scriptTag) {
    console.warn('[AIS SDK] ⚠️ document.currentScript が取得できませんでした。非同期読み込みの場合、属性が取得できない可能性があります。');
  }

  // 疎通に成功した最新のエンドポイント
  const COLLECT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxZAObtc-3QzSf1m7bVXlo7C0cqRSyvvLXPDHNq_9DlRrnYMJbqTe5S9xAg184imZU/exec';

  let metrics = {
    occupancy: 0,
    volumeLevel: 0,
    isSticky: false,
    duration: 0,
    timestamp: Date.now()
  };

  const startTime = Date.now();
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  
  console.log(`[AIS SDK] New Session: ${sessionId}`);

  // 送信管理フラグ
  let isSending = false;

  // 1. 画面占有率（Occupancy）の計測
  let lastSentStatus = 'none'; // 'active' or 'removed'
  let isPermanentlyStopped = false;

  const observer = new IntersectionObserver((entries) => {
    if (isPermanentlyStopped) return;

    entries.forEach(entry => {
      const intersectionArea = entry.intersectionRect.width * entry.intersectionRect.height;
      const viewportArea = entry.rootBounds ? (entry.rootBounds.width * entry.rootBounds.height) : (window.innerWidth * window.innerHeight);
      
      const viewportOccupancy = (intersectionArea / viewportArea) * 100;
      metrics.occupancy = parseFloat(viewportOccupancy.toFixed(2));
      
      const currentStatus = metrics.occupancy > 0 ? 'active' : 'removed';

      // 状態が変化した瞬間のみ送信 (appeared / removed)
      if (currentStatus !== lastSentStatus) {
        console.log(`[AIS SDK] 📢 状態変化検知: ${lastSentStatus} -> ${currentStatus} (Occupancy: ${metrics.occupancy}%)`);
        lastSentStatus = currentStatus;
        
        const trigger = currentStatus === 'active' ? 'appeared' : 'removed';
        sendData(trigger);

        // removed になったら、それ以降のすべての活動を停止
        if (currentStatus === 'removed') {
          console.log('[AIS SDK] 🛑 広告が消去されたため、SDKの監視を完全に停止しました。');
          isPermanentlyStopped = true;
          observer.disconnect();
        }
      }
    });
  }, { 
    threshold: [0, 0.01, 0.1, 0.5, 1.0] // 閾値を絞って負荷軽減
  });

  // 2. ターゲット要素の特定と監視開始
  const initTracker = () => {
    const target = document.querySelector(selector);
    if (target) {
      observer.observe(target);
      const style = window.getComputedStyle(target);
      metrics.isSticky = style.position === 'fixed' || style.position === 'sticky';
      console.log(`[AIS SDK] ✅ ターゲット要素を監視開始: "${selector}"`);
    } else {
      // リトライ間隔を広げる (5秒)
      setTimeout(initTracker, 5000);
    }
  };

  // 3. 音量レベル（VolumeLevel）の計測
  const updateVolumeMetrics = () => {
    const target = document.querySelector(selector);
    if (!target) return;

    const video = target.querySelector('video') || (target instanceof HTMLVideoElement ? target : null);
    
    if (video) {
      metrics.volumeLevel = video.muted ? 0 : Math.round(video.volume * 100);
    }
  };

  // 4. データ送信
  const sendData = (triggerType) => {
    // triggerType が必須。指定がない場合は送信しない（periodic を防止）
    if (!triggerType || isPermanentlyStopped) return;

    // 送信ガード: 前の送信が未完了、またはタブが非表示の場合はスキップ
    if (isSending) {
      console.log(`[AIS SDK] ⏳ 送信スキップ: 前の送信が進行中のため、イベント "${triggerType}" を破棄します。`);
      return;
    }
    if (document.hidden) {
      console.log(`[AIS SDK] 💤 送信停止: タブが非表示のため、イベント "${triggerType}" をブロックしました。`);
      return;
    }

    const target = document.querySelector(selector);
    
    // 消去イベント (removed) の判定強化
    const isRemoved = !target || metrics.occupancy <= 0;
    
    updateVolumeMetrics();
    
    const occupancy = target ? Number(metrics.occupancy || 0) : 0;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const now = new Date();
    const timestamp = now.toISOString();

    // --- 公式ロジックの実装 ---
    // 1. Exposure = duration * Weights
    // Weights = (isForced ? force : 1.0) * (isInterrupted ? interrupt : 1.0) * (isAudioIntrusive ? audio : 1.0)
    const isForced = !!target;
    const isInterrupted = metrics.isSticky;
    const isAudioIntrusive = metrics.volumeLevel > 0;

    const weights = (isForced ? forceWeight : 1.0) * 
                    (isInterrupted ? interruptWeight : 1.0) * 
                    (isAudioIntrusive ? audioWeight : 1.0);
    
    const exposure = duration * weights;

    // 2. VAF (Value After Forced)
    // 継続時 1.0 / 離脱・消去時 0.25
    const vaf = !isRemoved ? 1.0 : 0.25;

    // 3. AIS = Exposure * (1 / VAF)
    let aisScore = Math.round(exposure * (1 / vaf));

    const payload = {
      token: String(token),
      occupancy: occupancy,
      aisScore: aisScore,
      duration: duration,
      timestamp: timestamp,
      trigger: triggerType,
      status: !isRemoved ? 'active' : 'removed',
      sessionId: sessionId
    };

    // 無駄なデータの破棄: 占有率0かつスコア0のログは送信しない
    if (payload.occupancy === 0 && payload.aisScore === 0) {
      console.log(`[AIS SDK] 🗑️ データ破棄: 占有率0かつスコア0のため、イベント "${triggerType}" をスキップしました。`);
      return;
    }

    console.log(`[AIS SDK] 📤 送信実行 [${triggerType}]: Status=${payload.status}, Score=${aisScore}`);

    isSending = true;

    fetch(COLLECT_ENDPOINT, {
      method: 'POST',
      mode: 'cors', 
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify(payload)
    })
    .then((response) => {
      console.log(`[AIS SDK] ✨ 送信完了 [${triggerType}]: Status=${response.status || 200}`);
    })
    .catch((err) => {
      console.error(`[AIS SDK] ❌ 送信失敗 [${triggerType}]:`, err);
    })
    .finally(() => {
      isSending = false;
    });
  };

  // 初期化
  initTracker();
  
  // 定期送信 (periodic) と初期送信 (init) は負荷軽減のため完全廃止
  // console.log('[AIS SDK] Periodic/Init sends disabled to reduce server load.');

  // 外部インターフェース
  window.ais = {
    sendNow: (type = 'manual') => sendData(type),
    track: async (type, payload) => {
      sendData(type || 'event');
      return {
        id: payload.adId || 'demo-ad',
        name: payload.adName || 'Demo Ad',
        type: payload.adType || 'Video',
        log: {
          duration: payload.duration || 15,
          isForced: payload.metrics?.isForced || false,
          isInterrupted: payload.metrics?.isInterrupted || false,
          isAudioIntrusive: payload.metrics?.isAudioIntrusive || false,
          continueAfterAd: payload.metrics?.continueAfterAd ?? true,
          noMute: payload.metrics?.noMute ?? false,
          noSkip: payload.metrics?.noSkip ?? false,
          noLeave: payload.metrics?.noLeave ?? true
        }
      };
    }
  };

  console.log('[AIS SDK] Full logic restored.');
})();
