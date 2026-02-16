import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeftIcon, PencilIcon, MicIcon, StopCircleIcon, PlayIcon, LoadingIcon, InformationCircleIcon, SparklesIcon } from './Icons.tsx';
import { TestQuestion, TestResult, MasterSetting, Center } from '../types.ts';
import { generateAiContentAsync, sanitizeErrorMessage } from '../api.ts';
import { formatDateTime } from './utils.ts';
import TestResultModal from './TestResultModal.tsx';
import { FULL_CENTER_DATA } from './CenterSummaryPage.tsx';

interface KnowledgeTestProps {
  testQuestions: TestQuestion[];
  faqTopics: string[];
  masterSettings: MasterSetting[];
  traineeName: string;
  center: Center | null;
  apiKey: string | null;
  adminToken: string | null;
  onBack: () => void;
}

type TestState = 'selecting' | 'generating' | 'in_progress' | 'submitting' | 'completed';

/**
 * 曖昧なキー名から値を取得するユーティリティ
 */
const normalizeKey = (k: string) => 
    String(k || "")
     .replace(/[\s　]/g, '')
     .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
     .replace(/[Ａ-Ｚａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
     .toLowerCase();

const getFuzzyValue = (obj: any, candidates: string[], maxLength: number = 2000) => {
    if (!obj) return null;
    const keys = Object.keys(obj);
    const normalizedKeys = keys.map(k => ({ original: k, normalized: normalizeKey(k) }));
    const normalizedCandidates = candidates.map(c => normalizeKey(c));

    for (const nc of normalizedCandidates) {
        const found = normalizedKeys.find(nk => nk.normalized === nc);
        if (found) {
            const val = String(obj[found.original] || "").trim();
            if (val && val.length <= maxLength) return val;
        }
    }
    return null;
};

const strictNormalize = (str: string) => {
    if (!str) return '';
    return str.trim()
        .toLowerCase()
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/[Ａ-Ｚａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/[\s　]+/g, '')
        .replace(/(センター|インフォメーションセンター|インフォ)$/, '');
};

const checkDifficultyMatch = (q: TestQuestion, targetDifficulty: number | null): boolean => {
    if (targetDifficulty === null) return true;
    const diff = q.difficulty;
    if (diff === undefined || diff === null || (diff as any) === '') return false;
    let val = Number(diff);
    if (isNaN(val)) {
        const s = String(diff).trim().replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        val = Number(s);
    }
    if (!isNaN(val)) return val === Number(targetDifficulty);
    return false;
};

const getFuzzyQuestion = (q: any, idx: number): TestQuestion => {
    if (!q) return {} as TestQuestion;
    const name = getFuzzyValue(q, ["テスト名", "問題名", "テスト項目名", "名称", "案件", "項目", "タイトル", "問題"], 100) || `問題 (${idx + 1})`;
    return {
        id: q.id || q.ID || String(q["管理番号"] || ""),
        name: name,
        center: getFuzzyValue(q, ["センター", "対象", "center", "target", "所属", "部門", "略称"]) || "N/A",
        difficulty: Number(getFuzzyValue(q, ["難易度", "レベル", "difficulty", "level", "重要度"]) || 3),
        questionText: getFuzzyValue(q, ["問題文", "内容", "質問", "本文", "questionText", "text", "content"]) || "",
        answerText: getFuzzyValue(q, ["解答", "回答", "模範解答", "正解", "answerText", "answer", "modelAnswer"]) || "",
        smartphonePlan: getFuzzyValue(q, ["スマホプラン", "スマートフォン", "プラン"]) || "",
        lightPlan: getFuzzyValue(q, ["光プラン", "光", "セットプラン"]) || ""
    } as TestQuestion;
};

const KnowledgeTest: React.FC<KnowledgeTestProps> = ({ testQuestions, faqTopics, masterSettings, traineeName, center, apiKey, adminToken, onBack }) => {
  const [testState, setTestState] = useState<TestState>('selecting');
  const [activeQuestion, setActiveQuestion] = useState<TestQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [aiResult, setAiResult] = useState<TestResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  
  const [selectedCenter, setSelectedCenter] = useState<string>("AI_OMAKASE");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const transcriptBeforeListening = useRef('');
  
  const availableCenters = useMemo(() => {
    if (!masterSettings || !Array.isArray(masterSettings)) return [];
    return masterSettings
        .map((s, idx) => {
            const raw = s as any;
            const abbr = raw["略称"] || raw["センター略称"] || raw["センター名"] || raw["name"] || raw["abbreviation"] || raw["abbr"] || "";
            const displayVal = raw["表示"] !== undefined ? raw["表示"] : raw["displayFlag"];
            const isVisible = displayVal !== undefined ? (displayVal === true || String(displayVal).toLowerCase() === 'true' || displayVal === "TRUE") : true;
            const order = Number(raw["ソート順"] || raw["sortOrder"] || idx);
            return { abbr: String(abbr).trim(), isVisible, order, id: `center-opt-${idx}` };
        })
        .filter(s => s.abbr !== "" && s.isVisible)
        .sort((a, b) => a.order - b.order);
  }, [masterSettings]);

  useEffect(() => {
    if (center) {
      const exists = availableCenters.some(c => c.abbr === center);
      if (exists) {
        setSelectedCenter(center);
      }
    }
  }, [center, availableCenters]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'ja-JP';
    recognitionRef.current.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) fullTranscript += event.results[i][0].transcript;
        setUserAnswer(transcriptBeforeListening.current + fullTranscript);
    };
    recognitionRef.current.onend = () => setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { transcriptBeforeListening.current = userAnswer ? userAnswer + ' ' : ''; recognitionRef.current?.start(); setIsListening(true); }
  };
  
  const filteredQuestions = useMemo(() => {
    return testQuestions.map((q, idx) => getFuzzyQuestion(q, idx)).filter(q => {
        if (!q.center || !q.questionText) return false;
        const qCenters = String(q.center).split(/[,/、\s　]+/).map(strictNormalize).filter(Boolean);
        
        let isCenterMatch = false;
        if (selectedCenter === "AI_OMAKASE") {
             const traineeCenterNorm = center ? strictNormalize(center) : '';
             const enabledAbbrs = availableCenters.map(c => strictNormalize(c.abbr));
             if (traineeCenterNorm && qCenters.includes(traineeCenterNorm)) {
                 isCenterMatch = true;
             } else {
                 isCenterMatch = qCenters.some(qc => enabledAbbrs.includes(qc));
             }
        } else {
             const normSelectedCenter = strictNormalize(selectedCenter);
             isCenterMatch = qCenters.includes(normSelectedCenter);
        }
        if (!isCenterMatch) return false;
        return checkDifficultyMatch(q, selectedDifficulty);
    });
  }, [testQuestions, selectedCenter, selectedDifficulty, availableCenters, center]);

  const handleStartTest = useCallback(async () => {
    setIsStarting(true);
    setGenerationError(null);
    let candidates = filteredQuestions;
    let shouldGenerateNew = candidates.length === 0;
    try {
        let questionToStart: TestQuestion | undefined;
        if (shouldGenerateNew) {
            setTestState('generating');
            
            // センター情報の特定
            const targetCenterAbbr = selectedCenter === "AI_OMAKASE" ? (center || "総合インフォ") : selectedCenter;
            const centerData = FULL_CENTER_DATA.find(d => d.abbr === targetCenterAbbr || d.name.includes(targetCenterAbbr));
            
            // 業務範囲のコンテキスト化
            let businessScopeContext = "一般的な窓口業務";
            if (centerData) {
                const details = Array.isArray(centerData.details) 
                    ? centerData.details.join(', ')
                    : (centerData.details as any).col1.join(', ') + (centerData.details as any).col2.join(', ');
                businessScopeContext = `「${centerData.name}」の具体的担当範囲：${details}`;
            }

            const difficultyPrompt = selectedDifficulty === null ? "AIにお任せ（標準レベル）" : `レベル${selectedDifficulty}`;
            const randomTopic = faqTopics.length > 0 ? faqTopics[Math.floor(Math.random() * faqTopics.length)] : "料金プラン変更の相談";
            
            const prompt = `
                【最重要指示：ドコモ現行5プラン体系の遵守】
                あなたはドコモの教育担当エキスパートAIです。以下の「現在新規受付中の5プラン」に基づき、「${targetCenterAbbr}」向けの高品質なテスト問題を作成してください。
                
                ■現行プラン（新規受付中）:
                1. ドコモ MAX: 無制限・高品質プラン。
                2. ドコモ ポイ活 MAX: ポイント還元特化の最上位プラン。
                3. ドコモ ポイ活 20: 20GB＋ポイント還元の新時代プラン。
                4. ドコモ mini: 小容量・低価格プラン。
                5. ahamo (アハモ): オンライン手続き限定、30GB等のシンプルプラン。
                
                ■受付終了プラン（既存ユーザー対応のみ）:
                - eximo / irumo: 現在は新規受付をしていないため、これらから「現行5プラン」への変更相談という文脈でのみ使用してください。
                - ギガホ / ギガライト / カケホーダイ: 旧プラン。これらからのアップグレード提案は大歓迎です。

                ■プラン知識のポイント:
                - ahamoはオンライン手続き限定プランであることを踏まえた案内。
                - ポイ活プラン（MAX/20）とdカード決済・マネックス証券連携等のシナジー。

                ■担当センターの業務範囲:
                ${businessScopeContext}
                
                ■問題のトピック案:
                ${randomTopic}
                
                ■制約事項:
                1. 「ドコモ MAX」「ドコモ ポイ活 MAX/20」「ドコモ mini」を推奨プランの主軸に据えること。
                2. センターの業務範囲を逸脱した出題は禁止。
                3. 問題文は顧客が実際に言いそうな「問い合わせ内容（話し言葉）」で記述。
                4. 解答は「オペレーターとして正確、かつ丁寧な回答例」として作成。
                5. 難易度: ${difficultyPrompt}
            `;

            // Fixed: Removed extra arguments
            const { data: resStr } = await generateAiContentAsync({
                schemaName: 'generateTestQuestion',
                prompt: prompt
            });
            
            const generatedData = JSON.parse(resStr);
            questionToStart = { ...generatedData, center: targetCenterAbbr, id: `gen-${Date.now()}` } as TestQuestion;
        } else {
            questionToStart = candidates[Math.floor(Math.random() * candidates.length)];
        }
        if (!questionToStart) throw new Error("対象の問題が見つかりませんでした。");
        setActiveQuestion(questionToStart);
        setUserAnswer('');
        setAiResult(null);
        setTestState('in_progress');
    } catch (e: any) {
        setGenerationError(sanitizeErrorMessage(e));
        setTestState('selecting');
    } finally { setIsStarting(false); }
  }, [filteredQuestions, selectedCenter, center, selectedDifficulty, faqTopics]);
  
  const handleSubmitAnswer = async () => {
    if (!activeQuestion || !userAnswer.trim()) return;
    setTestState('submitting');
    try {
      // Fixed: Removed extra arguments
      const { data: resStr } = await generateAiContentAsync({
          prompt: `【問題】: ${activeQuestion.questionText}\n【模範解答】: ${activeQuestion.answerText}\n【研修生の回答】: ${userAnswer}`,
          systemInstruction: "あなたは教育担当者です。ドコモの現行プラン（MAX, ポイ活MAX, ポイ活20, mini, ahamo等）の知識に基づき、研修生の回答を厳密に採点し、5点満点のスコアと詳細な日本語アドバイスをJSON形式で返してください。",
          schemaName: 'analyzeTest' 
      });
      const result: TestResult = JSON.parse(resStr || "{}");
      result.modelAnswer = activeQuestion.answerText;
      setAiResult(result);
      setTestState('completed');
    } catch (err: any) {
      setGenerationError(sanitizeErrorMessage(err));
      setTestState('in_progress');
    }
  };

  const handleSafeBack = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (testState === 'in_progress' || testState === 'submitting') {
      if (window.confirm("テストを中断して学習メニューに戻りますか？")) onBack();
    } else onBack();
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-[2.5rem] shadow-2xl animate-fade-in relative max-w-2xl mx-auto border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={handleSafeBack} className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-sky-600 transition-all cursor-pointer group px-2 py-1">
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> 
            <span>学習メニューへ戻る</span>
        </button>
      </div>

      {testState === 'selecting' && (
        <div className="space-y-7 text-left">
            <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">知識テスト設定</h2>
            </div>

            {generationError && (
                 <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-shake">
                    <InformationCircleIcon className="h-5 w-5" />
                    {generationError}
                 </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-800 flex items-center gap-2 ml-1">
                 <span className="w-1.5 h-4 bg-sky-500 rounded-full"></span>
                 対象業務の選択
              </label>
              <div className="relative group">
                <select
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="w-full h-[62px] pl-12 pr-10 appearance-none bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-black text-slate-700 outline-none transition-all hover:border-sky-200 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/5 cursor-pointer shadow-sm"
                >
                    <option value="AI_OMAKASE">✨ AIにお任せ（全業務から選定）</option>
                    {availableCenters.map((c) => (
                        <option key={c.id} value={c.abbr}>
                            🏢 {c.abbr} {center === c.abbr ? ' (あなたの所属)' : ''}
                        </option>
                    ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {selectedCenter === "AI_OMAKASE" ? (
                        <SparklesIcon className="h-6 w-6 text-sky-500" />
                    ) : (
                        <div className="w-6 h-6 bg-sky-100 rounded-lg flex items-center justify-center border border-sky-200">
                            <div className="w-2 h-2 bg-sky-600 rounded-sm"></div>
                        </div>
                    )}
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-black text-slate-800 flex items-center gap-2 ml-1">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                    問題の難易度
                </label>
                <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="flex gap-6 mb-2">
                        {[1, 2, 3, 4, 5].map(level => (
                            <button key={level} type="button" onClick={() => setSelectedDifficulty(level)} className={`text-4xl transition-all transform active:scale-90 ${selectedDifficulty !== null && level <= selectedDifficulty ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                        ))}
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer mt-1 opacity-60 hover:opacity-100 transition-opacity">
                        <input type="radio" checked={selectedDifficulty === null} onChange={() => setSelectedDifficulty(null)} className="h-4 w-4 text-sky-600 focus:ring-sky-500" />
                        <span className="text-[11px] font-black text-sky-700 uppercase tracking-widest">AIにお任せ（標準レベル）</span>
                    </label>
                </div>
            </div>

            <div className="text-center pt-4">
                <button type="button" onClick={handleStartTest} disabled={isStarting} className="w-full bg-sky-600 text-white font-black h-[64px] rounded-2xl hover:bg-sky-700 shadow-xl transition-all flex items-center justify-center disabled:bg-slate-200 transform active:scale-95 text-lg">
                    {isStarting ? <><LoadingIcon className="h-6 w-6 mr-3" /><span>最新プラン情報を確認中...</span></> : <><PlayIcon className="h-6 w-6 mr-2" /><span className="tracking-widest">テストを開始する</span></>}
                </button>
            </div>
        </div>
      )}

      {testState === 'generating' && (
          <div className="text-center py-20 animate-pulse">
              <LoadingIcon className="h-16 w-16 mx-auto text-sky-600 mb-6" />
              <p className="text-2xl font-black text-slate-800 tracking-tighter">AIが最適な問題を生成しています...</p>
          </div>
      )}

      {(testState === 'in_progress' || testState === 'submitting') && activeQuestion && (
        <div className="space-y-6 max-w-3xl mx-auto text-left">
            <div className="flex justify-between items-end border-b-2 border-slate-100 pb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="bg-sky-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-widest shadow-sm">{activeQuestion.center}</span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{activeQuestion.name}</h3>
                    </div>
                </div>
            </div>
            
            <div className="p-6 bg-slate-900 rounded-3xl shadow-2xl relative group overflow-hidden border border-slate-800">
                <h4 className="text-[11px] font-black text-slate-500 mb-3 uppercase tracking-[0.3em] flex items-center gap-2">
                    <InformationCircleIcon className="w-4 h-4 text-sky-500" /> 顧客からの問い合わせ
                </h4>
                <p className="text-xl text-slate-100 whitespace-pre-wrap font-bold leading-relaxed">{activeQuestion.questionText}</p>
            </div>

            <div className="relative space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                   解答を入力
                </label>
                <textarea 
                    value={userAnswer} 
                    onChange={e => setUserAnswer(e.target.value)} 
                    placeholder="丁寧に応対してください..." 
                    rows={5} 
                    className="w-full p-5 border-2 border-slate-200 rounded-2xl focus:border-sky-500 focus:ring-8 focus:ring-sky-500/5 outline-none transition-all text-lg font-bold shadow-sm disabled:bg-slate-50" 
                    disabled={testState === 'submitting'} 
                />
                {recognitionRef.current && (
                    <button type="button" onClick={toggleListening} className={`absolute bottom-5 right-5 p-4 rounded-full shadow-2xl transition-all transform active:scale-90 z-20 ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-100 hover:text-rose-600'}`}>
                        {isListening ? <StopCircleIcon className="h-7 w-7" /> : <MicIcon className="h-7 w-7" />}
                    </button>
                )}
            </div>

            <button type="button" onClick={handleSubmitAnswer} disabled={!userAnswer.trim() || testState === 'submitting'} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-700 shadow-2xl disabled:bg-slate-300 transition-all flex items-center justify-center transform active:scale-95 text-xl tracking-widest h-[72px]">
                {testState === 'submitting' ? <><LoadingIcon className="h-7 w-7 mr-4" /><span>AI採点中...</span></> : <span>回答を提出して採点する</span>}
            </button>
        </div>
      )}

      {testState === 'completed' && aiResult && activeQuestion && (
          <TestResultModal 
            result={{
                ...aiResult, 
                timestamp: formatDateTime(new Date()), 
                traineeName, 
                center: center || 'N/A', 
                questionId: activeQuestion.id, 
                questionText: activeQuestion.questionText, 
                userAnswer, 
                aiFeedback: aiResult.evaluation, 
                score: aiResult.score, 
                modelAnswer: activeQuestion.answerText, 
                difficulty: activeQuestion.difficulty 
            }} 
            onClose={() => setTestState('selecting')} 
          />
      )}
    </div>
  );
};
export default KnowledgeTest;