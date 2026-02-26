import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../apiClient.ts';
import { TranscriptItem, Scenario, Persona } from '../types.ts';
import { Modality } from '@google/genai';
import { decode, decodeAudioData, encode } from '../ui/utils.ts';

export const useRolePlay = (scenario: Scenario | null, traineeName: string) => {
    const [status, setStatus] = useState<'ringing' | 'connecting' | 'connected' | 'analyzing' | 'idle'>('idle');
    const [messages, setMessages] = useState<TranscriptItem[]>([]);
    const [persona, setPersona] = useState<Persona | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<{ input: AudioContext; output: AudioContext; analyser: AnalyserNode } | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const inputBuffer = useRef('');
    const outputBuffer = useRef('');

    useEffect(() => {
        if (scenario) {
            setPersona({ ageGroup: '40代', personality: '穏やか', knowledgeLevel: '一般的', gender: '女性' });
            setStatus('ringing');
        }
    }, [scenario]);

    const cleanup = useCallback(() => {
        if (sessionRef.current) sessionRef.current.close();
        activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
        if (audioContextRef.current) {
            audioContextRef.current.input.close();
            audioContextRef.current.output.close();
        }
    }, []);

    const startSession = async () => {
        if (!scenario) return;
        setStatus('connecting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const analyser = inputCtx.createAnalyser();
            audioContextRef.current = { input: inputCtx, output: outputCtx, analyser };

            const sessionPromise = apiClient.connectLive({
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: `あなたは携帯電話会社の顧客です。状況: ${scenario.initialInquiry}。日本語で自然に答えてください。`
            }, {
                onopen: () => {
                    setStatus('connected');
                    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                        sessionRef.current?.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
                    };
                    const sourceMic = inputCtx.createMediaStreamSource(stream);
                    sourceMic.connect(processor);
                    processor.connect(inputCtx.destination);
                },
                onmessage: async (msg: any) => {
                    const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audio) {
                        const buffer = await decodeAudioData(decode(audio), outputCtx, 24000, 1);
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const src = outputCtx.createBufferSource();
                        src.buffer = buffer; src.connect(outputCtx.destination);
                        src.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += buffer.duration;
                        activeSourcesRef.current.add(src);
                    }
                    if (msg.serverContent?.inputTranscription) inputBuffer.current += msg.serverContent.inputTranscription.text;
                    if (msg.serverContent?.outputTranscription) outputBuffer.current += msg.serverContent.outputTranscription.text;
                    if (msg.serverContent?.turnComplete) {
                        setMessages(prev => [...prev, 
                            { speaker: 'user', text: inputBuffer.current },
                            { speaker: 'model', text: outputBuffer.current }
                        ].filter(m => String(m.text || "").trim()));
                        inputBuffer.current = ''; outputBuffer.current = '';
                    }
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (e) { setStatus('idle'); alert("接続エラー"); }
    };

    const completeRP = async () => {
        if (!scenario) return;
        setIsAnalyzing(true);
        try {
            const analysis = await apiClient.analyzeRolePlay(scenario, messages);
            const log = { ...analysis, traineeName, scenarioName: scenario.name, fullTranscript: messages, timestamp: new Date().toLocaleString() };
            await apiClient.saveRolePlayLog(log);
            setStatus('idle');
            return log;
        } finally { setIsAnalyzing(false); }
    };

    return { status, messages, persona, isAnalyzing, startSession, completeRP, cleanup };
};