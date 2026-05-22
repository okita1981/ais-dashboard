
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// 環境変数の読み込み (.envファイルがある場合)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// ビルド済みの静的ファイル (React) を配信
app.use(express.static(path.join(__dirname, 'dist')));

/**
 * AIS Data Ingestion API
 * SDKからのイベントを収集し、将来的にデータベースへ保存する口
 */
app.post('/api/v1/events', (req, res) => {
  const eventData = req.body;
  
  // Cloud Logging で確認できるようにログ出力
  console.log('AIS_EVENT_RECEIVED:', JSON.stringify({
    timestamp: new Date().toISOString(),
    ...eventData
  }));

  // ここで db.ts を通じて Firestore 等に保存する処理を呼び出す
  // await saveEvent(eventData);

  res.status(202).json({
    status: 'success',
    received_at: new Date().toISOString()
  });
});

// 全てのパスで index.html を返す (SPA対応)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AIS Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
