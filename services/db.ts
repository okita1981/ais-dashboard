
/**
 * AIS Persistence Layer (Template)
 * Cloud Run デプロイ時に Firestore 等へ接続するための雛形
 */

import { AdData } from '../types';

// NOTE: 実際の利用時には `firebase-admin` をインストールしてください
// import * as admin from 'firebase-admin';

/**
 * 広告イベントデータをデータベースに保存する (Firestore版 雛形)
 */
export async function saveEvent(data: AdData): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB Mock] Skipping persistent storage in non-prod environment.');
    return;
  }

  try {
    // 1. Firebase Adminの初期化 (シングルトン)
    // if (!admin.apps.length) admin.initializeApp();
    // const db = admin.firestore();

    // 2. データの保存
    // await db.collection('ais_events').add({
    //   ...data,
    //   server_timestamp: admin.firestore.FieldValue.serverTimestamp()
    // });

    console.log(`[DB Success] Event ${data.id} recorded.`);
  } catch (error) {
    console.error('[DB Error] Failed to save event to Firestore:', error);
    throw error;
  }
}

/**
 * プロジェクト全体の統計情報を取得する
 */
export async function getStats(projectToken: string) {
  // TODO: Firestoreの集計クエリを実装
  return {
    totalEvents: 0,
    averageAIS: 0
  };
}
