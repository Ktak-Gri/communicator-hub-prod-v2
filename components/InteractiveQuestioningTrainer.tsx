
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LoadingIcon, SparklesIcon, ArrowLeftIcon, PaperAirplaneIcon, LightBulbIcon, MicIcon, StopCircleIcon, CheckCircleIcon, InformationCircleIcon, HeadsetIcon, CloseIcon } from './Icons.tsx';
import { QuestioningTrainingTranscriptItem, Center, QuestioningTrainingLogScores } from '../types.ts';
import { generateAiContentAsync, sanitizeErrorMessage } from '../api.ts';

type TrainerState = 'idle' | 'loading_scenario' | 'in_progress' | 'analyzing_question' | 'ending' | 'ended';

interface Feedback {
  questionType: 'オープン' | 'クローズド' | '特定' | '不明';
  suggestion: string;
}

interface ScenarioData {
  topic: string;
  situation: string;
  initialInquiry: string;
  contractDetails: {
    mobilePlan: string;
    dataAllowance: string;
    fiberContract: string;
    setDiscount: string;
  };
}

interface InteractiveQuestioningTrainerProps {
    onBack: () => void;
    traineeName: string;
    center: Center | null;
    apiKey: string | null;
    adminToken: string | null;
}

const InteractiveQuestioningTrainer: React.FC<InteractiveQuestioningTrainerProps> = ({ onBack, traineeName, center, apiKey, adminToken }) => {
  const [state, setState] = useState<TrainerState>('idle');
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [transcript, setTranscript] = useState<QuestioningTrainingTranscriptItem[]>([]);
  const [userInput, setUserInput] = useState('');
  const [lastFeedback, setLastFeedback] = useState<Feedback | null>(null);
  const [finalAnalysis, setFinalAnalysis] = useState<{ summary: string; scores: QuestioningTrainingLogScores } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const transcriptBeforeListening = useRef('');
  const customerSystemInstructionRef = useRef<string>('');
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const startNewGame = useCallback(async () => {
    setState('loading_scenario');
    setError(null);
    setTranscript([]);
    setScenario(null);
    setLastFeedback(null);
    setFinalAnalysis(null);
    try {
      const { data: responseText } = await generateAiContentAsync({ 
          schemaName: 'generateQuestioningScenario',
          prompt: "ドコモのコールセンターを想定した、対話戦略（質問力）トレーニング用のシナリオを日本語で作成してください。トピック、顧客の状況、最初の問い合わせ内容は必ず自然な日本語にしてください。"
      });
      const result = JSON.parse(responseText || '{}');
      const contractDetails = result.contractDetails || {};
      const newScenario: ScenarioData = { 
          topic: result.topic || 'トピック不明', situation: result.situation || '状況不明', initialInquiry: result.initialInquiry || 'こんにちは。',
          contractDetails: {
              mobilePlan: contractDetails.mobilePlan || '不明', dataAllowance: contractDetails.dataAllowance || '不明',
              fiberContract: contractDetails.fiberContract || '不明', setDiscount: contractDetails.setDiscount || '不明',
          }
      };
      setScenario(newScenario);
      // FIX: Changed 'customer' role to 'model' for compatibility
      setTranscript([{ speaker: 'model', text: newScenario.initialInquiry }]);
      customerSystemInstructionRef.current = `あなたはドコモの顧客です。状況: ${newScenario.situation}\n契約状況: ${JSON.stringify(newScenario.contractDetails)}\n指示: 常に日本語で、顧客として自然に応答してください。聞き出されるまで情報は小出しにしてください。`;
      setState('in_progress');
    } catch (err: any) {
      setError(sanitizeErrorMessage(err));
      setState('idle');
    }
  }, []);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || state !== 'in_progress') return;
    const userMessage = userInput.trim();
    const newUserTurn: QuestioningTrainingTranscriptItem = { speaker: 'user', text: userMessage };
    const newTranscript = [...transcript, newUserTurn];
    setTranscript(newTranscript);
    setUserInput('');
    setState('analyzing_question');
    setError(null);
    try {
      const { data: feedbackStr } = await generateAiContentAsync({ 
          schemaName: 'analyzeQuestion', 
          prompt: `以下の質問を日本語で分析し、オープン質問かクローズド質問かを判別し、アドバイスを日本語で作成してください。\n質問: ${userMessage}`
      });
      const analysis = JSON.parse(feedbackStr || '{}');
      setLastFeedback(analysis);
      setTranscript(prev => prev.map(item => item === newUserTurn ? { ...item, feedback: analysis } : item));
      const conversationHistory = newTranscript.filter(item => item.speaker !== 'system').map(item => ({ role: item.speaker === 'user' ? 'user' : 'model', parts: [{ text: item.text }] }));
      const { data: responseText } = await generateAiContentAsync({ 
          contents: conversationHistory, 
          systemInstruction: customerSystemInstructionRef.current,
          prompt: "顧客として日本語で一言返答してください。"
      });
      // FIX: Changed 'customer' role to 'model' for compatibility
      setTranscript(prev => [...prev, { speaker: 'model', text: responseText }]);
      setState('in_progress');
    } catch (err: any) {
      setError(sanitizeErrorMessage(err));
      setState('in_progress');
    }
  };

  const handleEndTraining = async () => {
    setState('ending');
    setError(null);
    try {
      const { data: responseText } = await generateAiContentAsync({ 
          schemaName: 'analyzeQuestioningTraining', 
          prompt: `これまでの対話を日本語の応対品質基準で評価し、総評を日本語で作成してください。スコアは1-5の数値で返してください。\nテーマ: ${scenario?.topic}\n対話: ${JSON.stringify(transcript)}`
      });
      const analysisResult = JSON.parse(responseText || '{}');
      setFinalAnalysis(analysisResult);
      setState('ended');
    } catch (err: any) {
      setError(sanitizeErrorMessage(err));
      setState('in_progress');
    }
  };
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.lang = 'ja-JP';
    recognitionRef.current.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) fullTranscript += event.results[i][0].transcript;
        setUserInput(transcriptBeforeListening.current + fullTranscript);
    };
    recognitionRef.current.onend = () => setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    // FIX: Corrected variable name from 'userAnswer' to 'userInput'
    else { transcriptBeforeListening.current = userInput ? userInput + ' ' : ''; recognitionRef.current?.start(); setIsListening(true); }
  };

  const handleSafeBack = () => {
    if (state === 'in_progress' || state === 'analyzing_question') {
      if (window.confirm("トレーニングを中断してメニューに戻りますか？現在の記録は保存されません。")) {
        onBack();
      }
    } else {
      onBack();
    }
  };
  
  useEffect(() => { transcriptContainerRef.current?.scrollTo(0, transcriptContainerRef.current.scrollHeight); }, [transcript]);

  return (
    <div className="flex flex-col h-[80vh] bg-white p-4 sm:p-6 rounded-xl shadow-lg animate-fade-in relative border border-slate-100">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
            <button 
              onClick={handleSafeBack} 
              className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-sky-600 transition-colors cursor-pointer group"
            >
              <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> 学習メニューへ戻る
            </button>
            <div className="flex items-center gap-4">
                {state === 'in_progress' && <button onClick={handleEndTraining} className="bg-emerald-600 text-white font-black py-2 px-6 rounded-lg hover:bg-emerald-700 shadow-md transition-all active:scale-95">終了して評価</button>}
                {state === 'ended' && <button onClick={startNewGame} className="bg-sky-600 text-white font-black py-2 px-6 rounded-lg hover:bg-sky-700 shadow-md transition-all">新しいトレーニング</button>}
            </div>
        </div>

        {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 mb-4 rounded-xl flex items-start justify-between gap-3 animate-fade-in shadow-sm">
                <div className="flex items-start gap-2.5">
                    <InformationCircleIcon className="h-5 w-5 text-rose-500 mt-0.5" />
                    <div>
                        <p className="font-black text-xs uppercase tracking-wider mb-0.5 text-rose-400">System Alert</p>
                        <p className="text-sm font-bold leading-relaxed">{error}</p>
                    </div>
                </div>
                <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 p-1">
                    <CloseIcon className="h-4 w-4" />
                </button>
            </div>
        )}
        
        {state === 'idle' && (
            <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 max-w-lg text-center">
                    <HeadsetIcon className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-emerald-900 mb-2">「質問力」で真のニーズを掴む</h3>
                    <p className="text-sm text-emerald-700 leading-relaxed">
                        顧客の曖昧な発言から必要な情報を引き出すトレーニングです。AIがあなたの質問内容をリアルタイムで分析し、より良い対話へのヒントを提供します。
                    </p>
                </div>
                <button onClick={startNewGame} className="bg-emerald-600 text-white font-black py-4 px-12 rounded-full shadow-lg hover:bg-emerald-700 transform transition hover:scale-105 active:scale-95">トレーニングを開始</button>
            </div>
        )}
        {(state === 'loading_scenario' || state === 'ending') && (
            <div className="flex-grow flex flex-col items-center justify-center">
                <LoadingIcon className="h-12 w-12 text-emerald-600" />
                <p className="mt-4 font-bold text-slate-600">{state === 'ending' ? 'AIが対話を評価・分析中...' : '日本語のシナリオを準備中...'}</p>
            </div>
        )}
        {(state !== 'idle' && state !== 'loading_scenario' && state !== 'ending') && (
            <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className="flex-grow flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                    <div ref={transcriptContainerRef} className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                         {transcript.map((item, index) => (
                            <div key={index} className={`flex flex-col ${item.speaker === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                                <span className={`text-[10px] font-bold mb-1 uppercase tracking-widest ${item.speaker === 'user' ? 'text-sky-600' : 'text-slate-400'}`}>
                                    {item.speaker === 'user' ? 'あなた' : 'お客様'}
                                </span>
                                <div className={`p-4 rounded-2xl text-sm max-w-[85%] shadow-sm ${item.speaker === 'user' ? 'bg-sky-600 text-white' : 'bg-white text-slate-800'}`}>
                                    {item.text}
                                </div>
                                {item.feedback && (
                                    <div className="mt-2 text-xs bg-amber-50 p-3 border-l-4 border-amber-400 rounded-r-lg max-w-[80%] shadow-sm">
                                        <div className="flex items-center gap-1 font-bold text-amber-800 mb-1">
                                            <LightBulbIcon className="h-3 w-3" />
                                            <span>AIヒント: {item.feedback.questionType}質問</span>
                                        </div>
                                        <p className="text-amber-900 leading-relaxed">{item.feedback.suggestion}</p>
                                    </div>
                                )}
                            </div>
                         ))}
                    </div>
                    {state !== 'ended' && (
                        <form onSubmit={handleUserSubmit} className="mt-4 flex gap-2">
                            <textarea 
                                value={userInput} 
                                onChange={e => setUserInput(e.target.value)} 
                                placeholder="お客様に質問して情報を引き出してください..." 
                                className="flex-grow p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm shadow-sm" 
                                rows={2} 
                                disabled={state !== 'in_progress'} 
                            />
                            <div className="flex flex-col gap-2">
                                <button type="button" onClick={toggleListening} className={`p-3 rounded-xl transition-colors shadow-sm ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-200 hover:text-rose-500'}`}>
                                    {isListening ? <StopCircleIcon className="h-6 w-6" /> : <MicIcon className="h-6 w-6" />}
                                </button>
                                <button type="submit" className="bg-emerald-600 text-white p-3 rounded-xl shadow-md hover:bg-emerald-700 disabled:bg-slate-300 transition-all" disabled={state !== 'in_progress' || !userInput.trim()}>
                                    <PaperAirplaneIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                <div className="md:w-80 flex flex-col gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 rounded-lg">
                                <SparklesIcon className="h-4 w-4 text-amber-600" />
                            </div>
                            現在のトピック
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest text-center">練習テーマ</p>
                            <p className="text-sm font-bold text-slate-700 leading-snug text-center">{scenario?.topic}</p>
                        </div>
                    </div>
                    <div className="flex-grow bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-y-auto">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 rounded-lg">
                                <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                            </div>
                            AIによる分析と評価
                        </h3>
                        {state === 'ended' && finalAnalysis ? (
                            <div className="space-y-5 animate-fade-in">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{finalAnalysis.summary}</p>
                                </div>
                                <div className="pt-4 border-t border-slate-100 space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">スキル評価スコア</h4>
                                    {[
                                        { label: '情報収集力', score: finalAnalysis.scores.informationGathering },
                                        { label: '仮説構築力', score: finalAnalysis.scores.hypothesisBuilding },
                                        { label: '質問技法', score: finalAnalysis.scores.questioningTechnique },
                                        { label: '会話主導権', score: finalAnalysis.scores.initiative },
                                        { label: '課題特定力', score: finalAnalysis.scores.problemIdentification },
                                    ].map(s => (
                                        <div key={s.label} className="space-y-1">
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-slate-500 font-bold">{s.label}</span>
                                                <span className="font-bold text-slate-700">{s.score}/5</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(s.score / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-40">
                                <div className="bg-slate-50 p-4 rounded-full mb-3">
                                    <InformationCircleIcon className="h-10 w-10 text-slate-300" />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">トレーニング終了後に<br/>詳細な分析が表示されます</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
export default InteractiveQuestioningTrainer;
