
import { TestQuestion } from './types.ts';

export const domainLearning = {
  // FIX: normalizeQuestion must return a TestQuestion object with all required properties including internalId
  normalizeQuestion: (q: any, idx: number): TestQuestion => {
    const id = q.id || `T-${idx}`;
    return {
      id,
      internalId: `T-${idx}-${id}`,
      name: q.name || q.テスト名 || "プラン知識テスト",
      center: q.center || q.センター || "全般",
      questionText: q.questionText || q.問題文 || "",
      answerText: q.answerText || q.解答 || "",
      difficulty: Number(q.difficulty || 3)
    };
  },

  buildGenPrompt: (centerAbbr: string, centerFullData: string) => `
    ドコモの教育担当として、「${centerAbbr}」向けの高品質なテスト問題を作成してください。
    現行5プラン(MAX, ポイ活MAX/20, mini, ahamo)に基づいた内容にしてください。
    担当範囲コンテキスト: ${centerFullData}
  `
};
