import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { SessionLog, TestHistoryItem, Center, QuestioningTrainingLog, QuestioningTrainingTranscriptItem, Scenario } from '../types.ts';
import { LoadingIcon, CloseIcon, InformationCircleIcon } from './Icons.tsx';
import FeedbackModal from './FeedbackModal.tsx';
import TestResultModal from './TestResultModal.tsx';
import { requestWithJsonp } from '../api.ts';

// --- Client-side Data Processing ---
const processRawLogs = (rawData: { headers: string[], rows: any[] }, type: LogType): any[] => {
    if (!rawData || !Array.isArray(rawData.rows)) {
        return [];
    }
    
    const logs = rawData.rows;

    return logs.map(log => {
        // キーの正規化 (日本語ヘッダーへの対応)
        const sanitizedLog = { ...log };
        sanitizedLog.traineeName = log.研修生名 || log.研修生 || log.traineeName || log.trainee || "";
        sanitizedLog.center = log.センター || log.center || "";
        sanitizedLog.timestamp = log.実施日時 || log.timestamp || log.startTime || "";

        if (type === 'roleplay') {
            sanitizedLog.scenarioName = log.シナリオ名 || log.scenarioName || "";
            try {
                if (typeof sanitizedLog.persona === 'string') {
                    sanitizedLog.persona = JSON.parse(sanitizedLog.persona);
                }
            } catch (e) {
                console.error("Failed to parse persona JSON:", e, sanitizedLog.persona);
                sanitizedLog.persona = null; 
            }
            try {
                if (typeof sanitizedLog.fullTranscript === 'string') {
                    sanitizedLog.fullTranscript = JSON.parse(sanitizedLog.fullTranscript);
                }
            } catch (e) {
                console.error("Failed to parse transcript JSON:", e, sanitizedLog.fullTranscript);
                sanitizedLog.fullTranscript = null; 
            }

            sanitizedLog.fullTranscript = Array.isArray(sanitizedLog.fullTranscript) ? sanitizedLog.fullTranscript : [];
            sanitizedLog.persona = (typeof sanitizedLog.persona === 'object' && sanitizedLog.persona !== null && !Array.isArray(sanitizedLog.persona)) 
                ? sanitizedLog.persona 
                : { knowledgeLevel: 'N/A', personality: 'N/A', ageGroup: 'N/A', gender: 'N/A' };
            sanitizedLog.scores = (typeof log.scores === 'object' && log.scores !== null && !Array.isArray(log.scores)) 
                ? log.scores 
                : {};
        } else if (type === 'test') {
            sanitizedLog.questionText = log.問題名 || log.問題 || log.questionText || "";
        } else if (type === 'questioning') {
            sanitizedLog.scenarioTopic = log.トピック || log.シナリオトピック || log.scenarioTopic || "";
        }
        
        return sanitizedLog;
    });
};

// --- Component Types ---
interface HistoryPageProps {
  traineeName: string;
  center: Center | null;
  scenarios: Scenario[];
}

type LogType = 'roleplay' | 'test' | 'questioning';
type LogState = { status: 'idle' | 'loading' | 'success' | 'error'; error: string | null };

// --- Components ---
const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-slate-50 p-4 rounded-xl text-center shadow-sm border border-slate-100 flex-1">
        <p className="text-xs font-bold text-slate-500 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-sky-600 tracking-tighter truncate px-1">{value}</p>
    </div>
);

const AiBadge: React.FC = () => (
  <span className="ml-2 px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-200 rounded-full align-middle">
    AI自動生成
  </span>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="py-12 text-center flex flex-col items-center justify-center animate-fade-in">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
            <InformationCircleIcon className="h-10 w-10 text-slate-200" />
        </div>
        <p className="text-lg font-black text-slate-400 tracking-tight">{message}</p>
        <p className="text-[10px] text-slate-300 font-black mt-2 uppercase tracking-widest">No Records Found</p>
    </div>
);

const QUESTIONING_RADAR_CRITERIA = [
  { key: 'informationGathering', name: '情報収集力' },
  { key: 'hypothesisBuilding', name: '仮説構築力' },
  { key: 'questioningTechnique', name: '質問技法' },
  { key: 'initiative', name: '会話の主導権' },
  { key: 'problemIdentification', name: '課題特定力' },
];

const QuestioningLogDetailModal: React.FC<{ log: QuestioningTrainingLog, onClose: () => void }> = ({ log, onClose }) => {
    const parsedTranscript = useMemo((): QuestioningTrainingTranscriptItem[] => {
        try {
            return typeof log.transcript === 'string' ? JSON.parse(log.transcript) : [];
        } catch (e) {
            console.error("Failed to parse transcript:", e);
            return [{ speaker: 'system', text: 'トランスクリプトの解析に失敗しました。' }];
        }
    }, [log.transcript]);

    const chartData = useMemo(() => {
        if (!log.scores) return [];
        return QUESTIONING_RADAR_CRITERIA.map(criterion => ({
            subject: criterion.name,
            score: log.scores[criterion.key as keyof typeof log.scores] || 0,
            fullMark: 5,
        }));
    }, [log.scores]);


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 animate-fade-in" onClick={onClose}>
            <div role="dialog" aria-modal="true" className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-700">対話戦略トレーニング ログ詳細</h3>
                        <p className="text-xs text-slate-500">{log.timestamp} - {log.traineeName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h4 className="font-semibold text-slate-700 mb-2 text-center">スキル評価チャート</h4>
                             <ResponsiveContainer width="100%" height={300}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
                                    <Radar name="スコア" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h4 className="font-semibold text-slate-700 mb-2 text-lg">AIによる総合評価</h4>
                            <div className="text-slate-800 whitespace-pre-wrap text-base max-h-[280px] overflow-y-auto leading-relaxed">{log.aiSummary}</div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h4 className="font-semibold text-slate-700 mb-2">シナリオ概要</h4>
                        <p className="text-base"><strong>トピック:</strong> {log.scenarioTopic}</p>
                        <p className="text-base"><strong>顧客の状況(非公開情報):</strong> {log.customerSituation}</p>
                    </div>
                   
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h4 className="font-semibold text-slate-700 mb-2">トランスクリプト</h4>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2 bg-slate-50 p-4 rounded">
                            {parsedTranscript.map((item, index) => (
                                <div key={index} className={`flex flex-col ${item.speaker === 'user' ? 'items-end' : item.speaker === 'system' ? 'items-center' : 'items-start'}`}>
                                    {item.speaker !== 'system' && (<span className={`text-xs font-black mb-1 ${item.speaker === 'user' ? 'text-sky-700' : 'text-slate-500'}`}>{item.speaker === 'user' ? 'あなた' : '顧客'}</span>)}
                                    <div className={`max-w-xl p-3 rounded-2xl text-base ${item.speaker === 'user' ? 'bg-sky-600 text-white rounded-tr-none shadow-md' : item.speaker === 'system' ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-800 rounded-tl-none shadow-sm border'}`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{item.text}</p>
                                    </div>
                                    {item.speaker === 'user' && item.feedback && (
                                        <div className="mt-2 max-w-xl w-full p-4 border-l-4 border-amber-400 bg-amber-50 text-sm text-amber-900 rounded-r-2xl shadow-sm">
                                            <p className="font-black mb-1">AI解析: {item.feedback.questionType}質問</p>
                                            <p className="leading-relaxed">{item.feedback.suggestion}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const HistoryPage: React.FC<HistoryPageProps> = ({ traineeName, center, scenarios }) => {
    if (!traineeName || !center) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-xl text-center animate-fade-in border border-slate-100">
                <h2 className="text-xl font-black text-slate-800">ユーザー情報が未設定です</h2>
                <p className="mt-2 text-slate-600 text-base leading-relaxed">
                    研修記録を表示するには、研修生名と所属センターの情報が必要です。<br />
                    個人設定ページで情報を入力してから再試行してください。
                </p>
            </div>
        );
    }

  const [activeTab, setActiveTab] = useState<LogType>('roleplay');
  
  const [rolePlayHistory, setRolePlayHistory] = useState<SessionLog[]>([]);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [questioningHistory, setQuestioningHistory] = useState<QuestioningTrainingLog[]>([]);

  const [rolePlayState, setRolePlayState] = useState<LogState>({ status: 'idle', error: null });
  const [testState, setTestState] = useState<LogState>({ status: 'idle', error: null });
  const [questioningState, setQuestioningState] = useState<LogState>({ status: 'idle', error: null });

  const [selectedLog, setSelectedLog] = useState<SessionLog | TestHistoryItem | QuestioningTrainingLog | null>(null);

  const fetchHistoryForType = useCallback(async (type: LogType) => {
    const actionMap: Record<LogType, string> = {
        roleplay: 'getUserHistoryRolePlay',
        test: 'getUserHistoryTest',
        questioning: 'getUserHistoryQuestioning'
    };
    const stateSetterMap: Record<LogType, React.Dispatch<React.SetStateAction<LogState>>> = {
        roleplay: setRolePlayState,
        test: setTestState,
        questioning: setQuestioningState
    };
    const dataSetterMap: Record<LogType, React.Dispatch<React.SetStateAction<any[]>>> = {
        roleplay: setRolePlayHistory,
        test: setTestHistory,
        questioning: setQuestioningHistory
    };

    const setState = stateSetterMap[type];
    const setData = dataSetterMap[type];

    setState({ status: 'loading', error: null });
    try {
        const { data: rawData } = await requestWithJsonp(actionMap[type], { traineeName, center });
        const processedData = processRawLogs(rawData, type);
        setData(processedData);
        setState({ status: 'success', error: null });
    } catch (e: any) {
        setState({ status: 'error', error: `履歴の取得に失敗しました: ${e.message}` });
        console.error(e);
    }
  }, [traineeName, center]);

  useEffect(() => {
    if (rolePlayState.status === 'idle') {
        fetchHistoryForType('roleplay');
    }
  }, [traineeName, center, rolePlayState.status, fetchHistoryForType]);

  useEffect(() => {
    if (activeTab === 'test' && testState.status === 'idle') {
        fetchHistoryForType('test');
    }
    if (activeTab === 'questioning' && questioningState.status === 'idle') {
        fetchHistoryForType('questioning');
    }
  }, [activeTab, testState.status, questioningState.status, fetchHistoryForType]);

  const performanceSummary = useMemo(() => {
      const avgTestScore = testHistory.length > 0
          ? Math.round(testHistory.reduce((acc, item) => acc + (item.score || 0), 0) / testHistory.length)
          : 'N/A';
      
      return {
          traineeName: traineeName || 'N/A',
          center: center || 'N/A',
          totalRolePlays: rolePlayHistory.length,
          totalTests: testHistory.length,
          totalQuestioning: questioningHistory.length,
          averageScore: avgTestScore,
      };
  }, [rolePlayHistory.length, testHistory, questioningHistory.length, traineeName, center]);

  const trendData = useMemo(() => {
    // 最新10件のテスト履歴を時系列（昇順）で並べる
    return [...testHistory]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-10)
      .map(item => ({
          date: item.timestamp.split(' ')[0].substring(5), // MM/DD形式
          score: item.score
      }));
  }, [testHistory]);

  const TabButton: React.FC<{ tab: LogType; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-2.5 font-black rounded-t-xl transition-all text-sm ${
        activeTab === tab
          ? 'bg-white text-indigo-600 border-b-0 border-slate-300 shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.05)]'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    const stateMap: Record<LogType, LogState> = {
        roleplay: rolePlayState,
        test: testState,
        questioning: questioningState
    };
    const currentState = stateMap[activeTab];

    if (currentState.status === 'loading') {
      return <div className="flex flex-col justify-center items-center p-10 space-y-3"><LoadingIcon className="h-8 w-8 text-indigo-600" /><span className="font-bold text-slate-500 text-sm">履歴を読み込み中...</span></div>;
    }
    if (currentState.status === 'error') {
      return (
        <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 p-6 rounded-2xl text-center">
            <p className="font-black text-base">{currentState.error}</p>
            <p className="text-[10px] font-bold mt-2 opacity-70 uppercase tracking-widest">Script Update Required</p>
        </div>
      );
    }
    
    switch(activeTab) {
        case 'roleplay':
            return rolePlayHistory.length > 0 ? (
                <div className="space-y-3">
                {rolePlayHistory.map((log, index) => {
                    const isAiGenerated = String(log.scenarioId).startsWith('gen-');
                    const scenarioDetails = scenarios.find(s => String(s.id) === String(log.scenarioId));
                    const scenarioName = scenarioDetails ? scenarioDetails.name : log.scenarioName;
                    
                    return (
                        <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex justify-between items-center group">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-400 font-mono mb-0.5 uppercase">{log.timestamp}</p>
                            <div className="flex items-center">
                                <p className="text-base font-black text-slate-800 truncate">{scenarioName}</p>
                                {isAiGenerated && <AiBadge />}
                            </div>
                            <p className="text-xs text-slate-500 font-bold mt-0.5">センター: {log.center}</p>
                        </div>
                        <button onClick={() => setSelectedLog(log)} className="ml-4 bg-indigo-600 text-white font-black py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 text-sm whitespace-nowrap">詳細</button>
                        </div>
                    );
                })}
                </div>
            ) : <EmptyState message="ロールプレイの学習記録がありません" />;

        case 'test':
            return testHistory.length > 0 ? (
                <div className="space-y-3">
                {testHistory.map((item, index) => {
                    const isAiGenerated = String(item.questionId).startsWith('gen-');
                    return (
                        <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex justify-between items-center group">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-[10px] font-black text-slate-400 font-mono mb-0.5 uppercase">{item.timestamp}</p>
                            <div className="flex items-center">
                                <p className="text-base font-black text-slate-800 truncate">知識確認テスト</p>
                                {isAiGenerated && <AiBadge />}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex text-yellow-400 gap-0.5" title={`難易度: ${item.difficulty || 'N/A'}`}>
                                    {[...Array(5)].map((_, i) => (<span key={i} className="text-sm">{i < (item.difficulty || 0) ? '★' : '☆'}</span>))}
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CENTER: {item.center}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Score</span>
                                <p className="text-2xl font-black text-sky-600 tracking-tighter leading-none">{item.score}</p>
                            </div>
                            <button onClick={() => setSelectedLog(item)} className="bg-indigo-600 text-white font-black py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 text-sm whitespace-nowrap">詳細</button>
                        </div>
                        </div>
                    );
                })}
                </div>
            ) : <EmptyState message="知識テストの学習記録がありません" />;
        
        case 'questioning':
            return questioningHistory.length > 0 ? (
                 <div className="space-y-3">
                    {questioningHistory.map((log, index) => (
                        <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all flex justify-between items-center group">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-400 font-mono mb-0.5 uppercase">{log.timestamp}</p>
                            <p className="text-base font-black text-slate-800 truncate">{log.scenarioTopic}</p>
                            <p className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">CENTER: {log.center}</p>
                        </div>
                        <button onClick={() => setSelectedLog(log)} className="ml-4 bg-indigo-600 text-white font-black py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 text-sm whitespace-nowrap">詳細</button>
                        </div>
                    ))}
                </div>
            ) : <EmptyState message="対話戦略の学習記録がありません" />;
    }
    return null;
  };

  return (
    <div className="animate-fade-in pb-8">
        { (rolePlayState.status === 'success' || testState.status === 'success' || questioningState.status === 'success') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 p-5 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col justify-between">
                    <h3 className="text-lg font-black text-slate-800 mb-4 tracking-tighter flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-sky-500 rounded-full"></div>
                        成績サマリー
                    </h3>
                    <div className="space-y-2">
                        <StatCard label="研修生名" value={performanceSummary.traineeName} />
                        <StatCard label="所属" value={performanceSummary.center} />
                        <div className="grid grid-cols-3 gap-2">
                            <StatCard label="RP" value={performanceSummary.totalRolePlays} />
                            <StatCard label="テスト" value={performanceSummary.totalTests} />
                            <StatCard label="戦略" value={performanceSummary.totalQuestioning} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 p-5 bg-white rounded-2xl shadow-xl border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 tracking-tighter flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                        パフォーマンス・トレンド
                    </h3>
                    {trendData.length > 1 ? (
                        <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                    <YAxis hide domain={[0, 5]} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                                        labelStyle={{ fontWeight: 900, color: '#1e293b' }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[180px] flex items-center justify-center text-slate-300 text-xs font-bold italic">
                            トレンドを表示するには2回以上のテスト実施が必要です
                        </div>
                    )}
                </div>
            </div>
        )}
      <div className="flex space-x-1 px-1">
        <TabButton tab="roleplay" label="ロールプレイ" />
        <TabButton tab="test" label="知識テスト" />
        <TabButton tab="questioning" label="対話戦略" />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-b-2xl rounded-tr-2xl shadow-2xl border-2 border-white -mt-[1px] min-h-[300px]">
        {renderContent()}
      </div>

      {selectedLog && activeTab === 'roleplay' && <FeedbackModal feedback={selectedLog as SessionLog} onClose={() => setSelectedLog(null)} />}
      {selectedLog && activeTab === 'test' && <TestResultModal result={selectedLog as TestHistoryItem} onClose={() => setSelectedLog(null)} />}
      {selectedLog && activeTab === 'questioning' && <QuestioningLogDetailModal log={selectedLog as QuestioningTrainingLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
};

export default HistoryPage;