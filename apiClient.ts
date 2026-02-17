
import { GoogleGenAI, Type } from "@google/genai";
import { WEB_APP_URL } from './constants.ts';

const packData = (data: any): string => {
    const json = JSON.stringify(data);
    const uint8 = new TextEncoder().encode(json);
    let binString = "";
    for (let i = 0; i < uint8.length; i++) binString += String.fromCharCode(uint8[i]);
    return btoa(binString);
};

const callJsonp = async (action: string, data: any = {}, token: string | null = null): Promise<any> => {
  return new Promise((resolve, reject) => {
    const cb = 'jsonp_' + Date.now() + Math.floor(Math.random() * 1000);
    const script = document.createElement('script');
    const url = sessionStorage.getItem('GAS_URL_OVERRIDE') || WEB_APP_URL;
    const packed = packData({ a: action, d: data, t: token });
    
    (window as any)[cb] = (res: any) => {
      script.remove();
      if (res.status === 'success') resolve(res);
      else reject(new Error(res.error || "GAS Error"));
    };
    
    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}p=${encodeURIComponent(packed)}&callback=${cb}`;
    script.onerror = () => { script.remove(); reject(new Error("Network Failure")); };
    document.body.appendChild(script);
  });
};

/**
 * Gemini API 応答の構造を定義するスキーマ
 */
const SCHEMAS: Record<string, any> = {
    generateTestQuestion: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            questionText: { type: Type.STRING },
            answerText: { type: Type.STRING },
            difficulty: { type: Type.NUMBER }
        },
        required: ["name", "questionText", "answerText"]
    },
    analyzeRolePlay: {
        type: Type.OBJECT,
        properties: {
            totalScore: { type: Type.NUMBER },
            scores: {
                type: Type.OBJECT,
                properties: {
                    politeness: { type: Type.NUMBER },
                    empathy: { type: Type.NUMBER },
                    accuracy: { type: Type.NUMBER },
                    problemSolving: { type: Type.NUMBER },
                    listeningSkill: { type: Type.NUMBER },
                    summarization: { type: Type.NUMBER }
                }
            },
            summary: { type: Type.STRING },
            keigoFeedback: { type: Type.STRING }
        },
        required: ["totalScore", "summary"]
    },
    generateQuestioningScenario: {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING },
            situation: { type: Type.STRING },
            initialInquiry: { type: Type.STRING }
        },
        required: ["topic", "situation", "initialInquiry"]
    },
    analyzeQuestion: {
        type: Type.OBJECT,
        properties: {
            questionType: { type: Type.STRING },
            suggestion: { type: Type.STRING }
        },
        required: ["questionType", "suggestion"]
    },
    analyzeTest: {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            evaluation: { type: Type.STRING }
        },
        required: ["score", "evaluation"]
    }
};

/**
 * Gemini API を用いたコンテンツ生成のヘルパー
 */
const generateAiContent = async (schemaName: string, prompt: string, systemInstruction?: string) => {
    // 常に最新のAPIキーを使用するため都度インスタンス化
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isComplex = schemaName.includes('analyze');
    const model = isComplex ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const config: any = { 
        systemInstruction: systemInstruction || "あなたはコールセンター研修専門のAIアシスタントです。常に日本語で、誠実かつ詳細なフィードバックを提供してください。",
        responseMimeType: "application/json",
        responseSchema: SCHEMAS[schemaName]
    };

    const response = await ai.models.generateContent({ 
        model, 
        contents: { parts: [{ text: prompt }] }, 
        config 
    });
    return JSON.parse(response.text || '{}');
};

export const apiClient = {
  // --- GAS API ---
  getSettings: () => callJsonp('getSettings'),
  validateTrainee: (name: string) => callJsonp('validateTrainee', { name }),
  adminLogin: (password: string) => callJsonp('adminLogin', { password }),
  saveRolePlayLog: (data: any) => callJsonp('saveRolePlayLog', data),
  saveTestLog: (data: any) => callJsonp('saveTestLog', data),
  updateSheet: (sheet: string, data: any[][], token: string | null) => callJsonp('updateSheet', { sheet, data }, token),
  pollCall: (traineeName: string) => callJsonp('pollCall', { traineeName }),
  initiateCall: (data: any) => callJsonp('initiateCall', data),
  endCall: (traineeName: string) => callJsonp('endCall', { traineeName }),
  syncTranscript: (traineeName: string, transcript: any) => callJsonp('syncTranscript', { traineeName, transcript }),

  // --- Gemini API ---
  generateContent: async (model: string, contents: any, config: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({ model, contents, config });
    return response;
  },

  connectLive: (config: any, callbacks: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config,
      callbacks
    });
  },

  // --- 抽象化された AI アクション ---
  // FIX: Added analyzeRolePlay method
  analyzeRolePlay: (scenario: any, transcript: any[]) => {
      const prompt = `Scenario: ${scenario.name}. Transcript: ${transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}`;
      return generateAiContent('analyzeRolePlay', prompt);
  },
  
  // FIX: Added generateTestQuestion method
  generateTestQuestion: (center: string, topic: string, difficulty: string) => {
      const prompt = `ドコモの教育担当として、「${center}」向けのテスト問題を作成してください。トピック: ${topic}, 難易度: ${difficulty}`;
      return generateAiContent('generateTestQuestion', prompt);
  },
  
  // FIX: Added scoreTestAnswer method
  scoreTestAnswer: (question: any, userAnswer: string) => {
      const prompt = `【問題】: ${question.questionText}\n【模範解答】: ${question.answerText}\n【研修生の回答】: ${userAnswer}`;
      const systemInstruction = "あなたは教育担当者です。研修生の回答を厳密に採点し、スコアとアドバイスを返してください。";
      return generateAiContent('analyzeTest', prompt, systemInstruction);
  },

  // FIX: Added generateQuestioningScenario method
  generateQuestioningScenario: () => {
      return generateAiContent('generateQuestioningScenario', "対話戦略（質問力）トレーニング用のシナリオを作成してください。");
  },

  // FIX: Added analyzeQuestionType method
  analyzeQuestionType: (text: string) => {
      return generateAiContent('analyzeQuestion', `以下の質問を分析してください: ${text}`);
  }
};
