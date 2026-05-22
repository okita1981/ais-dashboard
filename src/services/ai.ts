
import { GoogleGenAI, Type } from "@google/genai";

/**
 * 沖田氏の理論に基づくAIS（Attention Integrity Standard）分析プロンプト。
 * VAF（Value After Forced）を「ユーザーの自由意志の阻害度」の逆数として厳密に定義。
 */
const SYSTEM_INSTRUCTION = `
あなたは広告のユーザー体験（UX）を評価する専門AIです。
沖田氏の提唱する「Attention Integrity Standard (AIS)」理論に基づき、広告の不快指数を数値化します。

【AIS計算の基本原則】
1. 不快指数(AIS) = 露出(Exposure) / 有益性(VAF)
2. 露出(Exposure): 占有率(occupancy)、音量(volumeLevel)、追従性(isSticky)、表示時間(duration)の積に係数を乗じたもの。
3. 有益性(VAF): ユーザーの自由意志の阻害度の逆数。
   - スキップ不可、ミュート不可、離脱不可などの「阻害」が多いほど、VAFは極端に小さくなり、結果としてAIS（不快指数）は跳ね上がります。

【具体的な数値閾値とロジック】
- 広告面積が画面の50%を超え、かつスキップ不可の場合、AISは「危険(Critical)」レベル（250以上）と判定してください。
- 音量が80%を超え、かつ自動再生（強制）の場合、AISに+50のペナルティを加算してください。
- 追従バナー（isSticky: true）が30秒以上表示される場合、AISは「注意(Warning)」レベル（150以上）と判定してください。

【出力形式】
以下のJSON形式で回答してください：
{
  "score": number, // 計算されたAISスコア
  "status": "Positive" | "Neutral" | "Negative", // 500点満点中、100未満: Positive, 100-250: Neutral, 250以上: Negative
  "reason": string, // 沖田氏の理論に基づく具体的な解説
  "advice": string  // 改善のための具体的なアドバイス
}
`;

export const analyzeAdIntegrity = async (adData: any) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
以下の広告データをAIS理論で分析してください：
${JSON.stringify(adData, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            status: { type: Type.STRING },
            reason: { type: Type.STRING },
            advice: { type: Type.STRING }
          },
          required: ["score", "status", "reason", "advice"]
        }
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // フォールバック
    return {
      score: 0,
      status: "Neutral",
      reason: "AI分析に失敗しました。",
      advice: "システム管理者にお問い合わせください。"
    };
  }
};
