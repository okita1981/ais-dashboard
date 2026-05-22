/**
 * AIS (Attention Integrity Standard) Data Collector
 * 
 * 使い方:
 * 1. Google スプレッドシートを作成し、拡張機能 > Apps Script を開く
 * 2. このコードを貼り付ける
 * 3. 「デプロイ」 > 「新しいデプロイ」 > 「ウェブアプリ」を選択
 * 4. アクセスできるユーザーを「全員」にしてデプロイ
 * 5. 発行されたURLを SDK の COLLECT_ENDPOINT に設定
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // JSONデータの解析
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    // サーバー側での受信時刻（A列用）
    var serverTimestamp = new Date();
    
    // 送信データの抽出（SDKの最新仕様に準拠）
    var token = data.token || "no-token";
    var occupancy = data.occupancy || 0;
    var aisScore = data.aisScore || 0;
    var duration = data.duration || 0;
    var clientTimestamp = data.timestamp || "";
    var trigger = data.trigger || "unknown";
    var status = data.status || "unknown";
    var sessionId = data.sessionId || "no-session";
    
    // 新しい行として最下部に追記（上書き・重複チェックなし）
    // 時系列履歴をすべて残すための appendRow
    sheet.appendRow([
      serverTimestamp,  // A列: サーバー受信時刻
      token,            // B列: 広告識別子 (Token)
      occupancy,        // C列: 占有率 (%)
      aisScore,         // D列: AISスコア
      duration,         // E列: 累計表示時間 (秒)
      clientTimestamp,  // F列: クライアント側時刻 (ISO)
      trigger,          // G列: 送信トリガー (periodic/visibility_change/skip/init)
      status,           // H列: 状態 (active/removed)
      sessionId         // I列: セッションID
    ]);
    
    // 成功レスポンス
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "Data appended successfully",
      "received_at": serverTimestamp.toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    // エラーレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエスト（データの取得用）
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    // データがない場合（ヘッダーのみ、または空）
    if (!data || data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var jsonData = [];
    
    // 2行目からデータを取得
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || row.length < 2) continue; // 空行スキップ
      
      // スプレッドシートの列構成に合わせる
      // A: Server Timestamp, B: Token, C: Occupancy, D: AIS Score, E: Duration, F: Client Timestamp, G: Trigger, H: Status, I: Session ID
      var record = {
        "serverTimestamp": row[0] instanceof Date ? row[0].toISOString() : (row[0] || ""),
        "token": row[1] || "",
        "occupancy": row[2] || 0,
        "aisScore": row[3] || 0,
        "duration": row[4] || 0,
        "timestamp": row[5] || "",
        "trigger": row[6] || "",
        "status": row[7] || "",
        "sessionId": row[8] || ""
      };
      
      jsonData.push(record);
    }
    
    var output = JSON.stringify(jsonData);
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    var errorOutput = JSON.stringify({
      "status": "error",
      "message": err.toString()
    });
    return ContentService.createTextOutput(errorOutput)
      .setMimeType(ContentService.MimeType.JSON);
  }
}
