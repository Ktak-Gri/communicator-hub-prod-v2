
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

export const apiClient = {
  getSettings: () => callJsonp('getSettings'),
  validateTrainee: (name: string) => callJsonp('validateTrainee', { name }),
  adminLogin: (password: string) => callJsonp('adminLogin', { password }),
  saveLog: (action: string, data: any, token: string | null) => callJsonp(action, data, token),
  updateSheet: (sheet: string, data: any[][], token: string | null) => callJsonp('updateSheet', { sheet, data }, token),
  pollCall: (traineeName: string) => callJsonp('pollCall', { traineeName }),
  initiateCall: (data: any) => callJsonp('initiateCall', data),
  endCall: (sessionId: string, traineeName: string) => callJsonp('endCall', { sessionId, traineeName }),
  // Added missing GAS methods
  syncTranscript: (sessionId: string, transcript: any) => callJsonp('syncTranscript', { sessionId, transcript }),
  saveRolePlayLog: (data: any, token: string | null) => callJsonp('saveRolePlayLog', data, token),
  saveTestLog: (data: any, token: string | null) => callJsonp('saveTestLog', data, token),
  
  // Gemini Logic Implementations
  generateTestQuestion: async (center: string, topic: string, difficulty: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `ドコモの教育担当として、「${center}」向けの高品質なテスト問題を作成してください。トピック: ${topic}, 難易度: ${difficulty}。現行5プラン(MAX, ポイ活MAX/20, mini, ahamo)に基づいた内容にし、問題文と模範解答をJSONで返してください。`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            questionText: { type: Type.STRING },
            answerText: { type: Type.STRING },
            difficulty: { type: Type.NUMBER }
          },
          required: ["name", "questionText", "answerText"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  scoreTestAnswer: async (question: any, userAnswer: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `問題: ${question.questionText}\n模範解答: ${question.answerText}\n研修生の回答: ${userAnswer}\n上記を採点してください。`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            evaluation: { type: Type.STRING }
          },
          required: ["score", "evaluation"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  generateQuestioningScenario: async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = "ドコモのコールセンターを想定した、対話戦略（質問力）トレーニング用のシナリオを作成してください。";
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            situation: { type: Type.STRING },
            initialInquiry: { type: Type.STRING }
          },
          required: ["topic", "situation", "initialInquiry"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  analyzeQuestionType: async (text: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `以下の研修生の質問を分析し、オープン質問かクローズド質問かを判別してください: ${text}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questionType: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          },
          required: ["questionType", "suggestion"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  analyzeRolePlay: async (scenario: any, transcript: any[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const transcriptText = transcript.map(t => `${t.speaker === 'user' ? '研修生' : '顧客'}: ${t.text}`).join('\n');
    const prompt = `ロールプレイの対話を分析してください。シナリオ: ${scenario.name}\n対話ログ:\n${transcriptText}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalScore: { type: Type.NUMBER },
            scores: {
              type: Type.OBJECT,
              properties: {
                listeningSkill: { type: Type.NUMBER },
                empathy: { type: Type.NUMBER },
                accuracy: { type: Type.NUMBER },
                problemSolving: { type: Type.NUMBER },
                summarization: { type: Type.NUMBER },
                politeness: { type: Type.NUMBER }
              }
            },
            summary: { type: Type.STRING },
            keigoFeedback: { type: Type.STRING }
          },
          required: ["totalScore", "summary"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
};
