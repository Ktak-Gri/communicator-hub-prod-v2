import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LoadingIcon, PlayIcon, CheckCircleIcon, WifiOffIcon, MicIcon } from './Icons';
import { decode, decodeAudioData, encode } from './utils';

interface VoiceQualityCheckProps {
  apiKey: string | null;
}

type DiagnosticStatus = 'idle' | 'testing' | 'success' | 'failed';

const VoiceQualityCheck: React.FC<VoiceQualityCheckProps> = ({ apiKey }) => {
  const [status, setStatus] = useState<DiagnosticStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
        try { sessionRef.current.close(); } catch(e) {}
        sessionRef.current = null;
    }
    sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch(e) {}
        audioContextRef.current = null;
    }
    nextStartTimeRef.current = 0;
  }, []);

  const runDiagnostic = async () => {
    // Guidelines: Strictly use process.env.API_KEY
    const key = process.env.API_KEY;
    if (!key) {
        setErrorMessage("APIキーが環境変数から取得できません。");
        setStatus('failed');
        return;
    }

    cleanup();
    setStatus('testing');
    setErrorMessage(null);
    setLogs([]);
    addLog("診断開始...");

    try {
      addLog("マイクの使用許可をリクエスト中...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("マイクOK");

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      addLog("Gemini Live API 接続試行中...");
      const ai = new GoogleGenAI({ apiKey: key });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            addLog("接続確立成功！テストデータを送信中...");
            sessionPromise.then(session => {
                // Send dummy silent audio to trigger model response or keep alive
                const silentPCM = new Int16Array(1600).fill(0);
                session.sendRealtimeInput({
                    media: {
                        data: encode(new Uint8Array(silentPCM.buffer)),
                        mimeType: 'audio/pcm;rate=16000'
                    }
                });
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              addLog("音声データ受信中...");
              const audioBuffer = await decodeAudioData(
                decode(audioData),
                outputCtx,
                24000,
                1
              );
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              
              setStatus('success');
              addLog("診断完了: 正常に動作しています");
            }
          },
          onerror: (e) => {
            console.error(e);
            setErrorMessage("WebSocket接続エラー: ネットワークにより遮断されている可能性があります。");
            setStatus('failed');
          },
          onclose: () => {
            addLog("セッション終了");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: "あなたは接続テスト用のAIです。短く元気に「接続テスト成功です。通信品質は良好です。」と答えてください。"
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "予期せぬエラーが発生しました。");
      setStatus('failed');
      cleanup();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MicIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">音声品質・リアルタイム通信診断</h3>
          <p className="mt-2 text-slate-500 text-sm">
            お使いのブラウザとネットワーク環境で、Geminiのリアルタイム音声機能が正常に動作するかチェックします。
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 mb-6">
          {status === 'idle' && (
            <button
              onClick={runDiagnostic}
              className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-full hover:bg-indigo-700 transition shadow-lg flex items-center gap-2 group"
            >
              <PlayIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span>通信診断を開始する</span>
            </button>
          )}

          {status === 'testing' && (
            <div className="flex flex-col items-center gap-4">
              <LoadingIcon className="h-12 w-12 text-indigo-600" />
              <p className="font-bold text-indigo-800 animate-pulse">診断プログラムを実行中...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 text-emerald-600">
              <div className="bg-emerald-100 p-4 rounded-full">
                <CheckCircleIcon className="h-12 w-12" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">診断結果：良好</p>
                <p className="text-sm text-emerald-700 mt-1">リアルタイム音声通信は正常に利用可能です。</p>
              </div>
              <button onClick={() => setStatus('idle')} className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-700 underline">もう一度テストする</button>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center gap-4 text-rose-600 px-6">
              <div className="bg-rose-100 p-4 rounded-full">
                <WifiOffIcon className="h-12 w-12" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">診断結果：制限あり</p>
                <p className="text-sm text-rose-800 mt-2 bg-white p-3 rounded-lg border border-rose-200">
                  {errorMessage || "通信経路上のセキュリティ設定により、リアルタイム通信が制限されています。"}
                </p>
              </div>
              <button onClick={runDiagnostic} className="mt-4 bg-rose-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-700 shadow-md">再試行</button>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-lg p-4 font-mono text-[10px] text-sky-400 overflow-hidden shadow-inner">
          <p className="text-slate-500 mb-2 border-b border-slate-800 pb-1 uppercase tracking-widest font-bold">Diagnostic Logs</p>
          {logs.length === 0 && <p className="text-slate-700 italic">待機中...</p>}
          {logs.map((log, i) => <div key={i} className="leading-relaxed">{log}</div>)}
        </div>
      </div>
    </div>
  );
};

export default VoiceQualityCheck;