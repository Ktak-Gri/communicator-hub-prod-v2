import { GoogleGenAI, Type } from "@google/genai";
import { WEB_APP_URL } from './constants.ts';

interface ApiResponse { status: 'success' | 'error'; data?: any; error?: string; version?: string; }

type ApiLogListener = (message: string) => void;
const listeners: ApiLogListener[] = [];

export const addApiLogListener = (l: ApiLogListener) => { listeners.push(l); };

function logApi(msg: string) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMsg = `[${timestamp}] ${msg}`;
  listeners.forEach(l => l(formattedMsg));
  console.log(`[API_LOG] ${msg}`);
}

export const getEffectiveUrl = () => {
    const override = sessionStorage.getItem('GAS_URL_OVERRIDE');
    return override || WEB_APP_URL;
};

export const setSessionUrlOverride = (url: string | null) => {
    if (url) sessionStorage.setItem('GAS_URL_OVERRIDE', url);
    else sessionStorage.removeItem('GAS_URL_OVERRIDE');
};

function packData(data: any): string {
    const json = JSON.stringify(data);
    const uint8 = new TextEncoder().encode(json);
    let binString = "";
    for (let i = 0; i < uint8.length; i++) {
        binString += String.fromCharCode(uint8[i]);
    }
    return btoa(binString);
}

async function callJsonp(packed: string, url: string): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
        const cb = 'jsonp_' + Date.now() + Math.floor(Math.random() * 1000);
        const script = document.createElement('script');
        script.id = cb;
        
        const timeout = setTimeout(() => {
            delete (window as any)[cb];
            script.remove();
            reject(new Error("GAS通信タイムアウト（15秒経過）。データ量が多すぎるか、ネットワークが不安定です。"));
        }, 15000);

        (window as any)[cb] = (res: ApiResponse) => {
            clearTimeout(timeout);
            delete (window as any)[cb];
            script.remove();
            resolve(res);
        };
        
        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = `${url}${separator}p=${encodeURIComponent(packed)}&callback=${cb}`;
        
        // URL長制限チェック (一般的に2000文字程度が安全。GAS/ブラウザ制限対策)
        if (finalUrl.length > 2000) {
            console.warn(`Warning: API URL length is ${finalUrl.length}. これは "Script load failed" の原因になります。シナリオの数や文字数を減らしてください。`);
        }

        script.src = finalUrl;
        script.onerror = () => {
            clearTimeout(timeout);
            script.remove();
            reject(new Error("Script load failed: GASへの接続に失敗しました。データ量が多すぎる（URLが長すぎる）か、Googleアカウントのログイン状態、またはGASの公開権限設定（Anyone）を確認してください。"));
        };
        document.body.appendChild(script);
    });
}

export const requestWithJsonp = async (a: string, d: any = {}, t: string | null = null) => {
  const currentUrl = getEffectiveUrl();
  try {
      logApi(`Action: ${a}`);
      const res = await callJsonp(packData({ a, d, t }), currentUrl);
      if (res.status === 'success') return { data: res.data, version: res.version };
      throw new Error(res.error || "GAS Error");
  } catch (e: any) {
      logApi(`Error: ${a} - ${e.message}`);
      throw e;
  }
};

export const sanitizeErrorMessage = (e: any) => e?.message || String(e);

// AI Logic
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
    analyzeQuestioningTraining: {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            scores: {
                type: Type.OBJECT,
                properties: {
                    informationGathering: { type: Type.NUMBER },
                    hypothesisBuilding: { type: Type.NUMBER },
                    questioningTechnique: { type: Type.NUMBER },
                    initiative: { type: Type.NUMBER },
                    problemIdentification: { type: Type.NUMBER }
                }
            }
        },
        required: ["summary", "scores"]
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

export async function generateAiContentAsync(params: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isComplex = params.schemaName?.includes('analyze');
    const model = isComplex ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const config: any = { 
        systemInstruction: params.systemInstruction || "あなたはコールセンター研修専門のAIアシスタントです。常に日本語で、誠実かつ詳細なフィードバックを提供してください。",
        responseMimeType: "application/json"
    };

    if (params.schemaName && SCHEMAS[params.schemaName]) {
        config.responseSchema = SCHEMAS[params.schemaName];
    }

    try {
        const response = await ai.models.generateContent({ 
            model, 
            contents: params.contents || { parts: [{ text: params.prompt || "Hello" }] }, 
            config 
        });
        return { data: response.text };
    } catch (e: any) {
        logApi(`Gemini Error: ${e.message}`);
        throw e;
    }
}