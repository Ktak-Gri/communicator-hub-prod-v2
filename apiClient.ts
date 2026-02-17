
import { GoogleGenAI, Type } from "@google/genai";
import { WEB_APP_URL } from './constants.ts';

let lastBackendVersion: string | null = null;
export const getBackendVersion = () => lastBackendVersion;

const packData = (data: any): string => {
    try {
        const json = JSON.stringify(data);
        const uint8 = new TextEncoder().encode(json);
        let bin = "";
        uint8.forEach(b => { bin += String.fromCharCode(b); });
        return btoa(bin);
    } catch (e) {
        console.error("Encoding failed", e);
        return "";
    }
};

const callJsonp = async (action: string, data: any = {}, token: string | null = null): Promise<any> => {
  const baseUrl = sessionStorage.getItem('GAS_URL_OVERRIDE') || WEB_APP_URL;
  const packed = packData({ a: action, d: data, t: token });
  const cb = 'jsonp_cb_' + Math.random().toString(36).substring(2);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const finalUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}p=${encodeURIComponent(packed)}&callback=${cb}`;
    
    // URL長制限チェック (2KB)
    if (finalUrl.length > 2000) {
        console.warn(`[Critical] Request size (${finalUrl.length} chars) may exceed JSONP limit for: ${action}`);
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`通信タイムアウト: ${action} (サーバー応答なし)`));
    }, 60000); // 1分に延長

    const cleanup = () => {
      clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[cb];
    };

    (window as any)[cb] = (res: any) => {
      cleanup();
      if (res && res.version) lastBackendVersion = res.version;
      if (res && res.status === 'success') resolve(res);
      else reject(new Error(res?.error || "サーバーエラーが発生しました"));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("接続エラー: サーバーに到達できません。URL設定を確認してください。"));
    };

    script.src = finalUrl;
    document.body.appendChild(script);
  });
};

export const apiClient = {
  requestWithJsonp: callJsonp,
  getSettings: () => callJsonp('getSettings'),
  validateTrainee: (name: string) => callJsonp('validateTrainee', { name }),
  adminLogin: (password: string) => callJsonp('adminLogin', { password }),
  saveRolePlayLog: (data: any) => callJsonp('saveRolePlayLog', data),
  saveTestLog: (data: any) => callJsonp('saveTestLog', data),
  updateSheet: (sheet: string, data: any[][], token: string | null) => callJsonp('updateSheet', { sheet, data }, token),
  deleteScenario: (id: string, token: string | null) => callJsonp('deleteScenario', { id }, token),
  deleteTestQuestion: (id: string, token: string | null) => callJsonp('deleteTestQuestion', { id }, token),
  pollCall: (traineeName: string) => callJsonp('pollCall', { traineeName }),
  initiateCall: (data: any) => callJsonp('initiateCall', data),
  endCall: (data: any) => callJsonp('endCall', data),
  syncTranscript: (sessionId: string, transcript: any[], status?: string) => callJsonp('syncTranscript', { sessionId, transcript, status }),

  generateAiContent: async (schemaName: string | null, prompt: string, systemInstruction?: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({ 
        model: 'gemini-3-pro-preview', 
        contents: prompt, 
        config: { 
          systemInstruction: systemInstruction || "あなたは優秀な教育担当AIです。常に日本語で、構造化された JSON 形式で回答してください。", 
          responseMimeType: "application/json"
        } 
    });
    
    const text = response.text;
    if (!text) return {};
    try {
        return JSON.parse(text.trim());
    } catch (e) {
        // フォールバック: テキストからJSONを抽出
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
        throw e;
    }
  },

  // FIX: Added generateTestQuestion to support KnowledgeTest hook
  generateTestQuestion: async (center: string, topic: string, difficulty: string) => {
    const prompt = `ドコモのコールセンター（${center}）向けの「${topic}」に関する知識テスト問題を1問作成してください。難易度は5段階中${difficulty}です。
    JSON形式で返してください。キー: name, questionText, answerText, difficulty`;
    return apiClient.generateAiContent('generateTestQuestion', prompt);
  },

  // FIX: Added scoreTestAnswer to support KnowledgeTest scoring in hook
  scoreTestAnswer: async (question: any, answer: string) => {
    const prompt = `以下の回答を5点満点で採点し、評価を提供してください。
    問題: ${question.questionText}
    模範解答: ${question.answerText}
    研修生の回答: ${answer}
    JSON形式で返してください。キー: score, evaluation`;
    return apiClient.generateAiContent('scoreTestAnswer', prompt);
  },

  // FIX: Added generateQuestioningScenario to support QuestioningTrainer hook
  generateQuestioningScenario: async () => {
    const prompt = `コールセンターの対話戦略（質問力）トレーニング用のシナリオを作成してください。
    JSON形式で返してください。キー: topic, initialInquiry`;
    return apiClient.generateAiContent('generateQuestioningScenario', prompt);
  },

  // FIX: Added analyzeQuestionType to support QuestioningTrainer analysis in hook
  analyzeQuestionType: async (text: string) => {
    const prompt = `以下の質問が「オープン質問」か「クローズド質問」かを分析し、アドバイスを提供してください。
    発言: ${text}
    JSON形式で返してください。キー: type, advice`;
    return apiClient.generateAiContent('analyzeQuestionType', prompt);
  },

  analyzeRolePlay: async (scenario: any, transcript: any[]) => {
      const prompt = `以下のロールプレイング対話を分析してください。\nシナリオ: ${JSON.stringify(scenario)}\n対話ログ: ${JSON.stringify(transcript)}`;
      return apiClient.generateAiContent('analyzeRolePlay', prompt);
  },

  connectLive: (config: any, callbacks: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({ model: 'gemini-2.5-flash-native-audio-preview-12-2025', config, callbacks });
  }
};
