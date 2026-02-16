
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { SessionLog, TestHistoryItem, QuestioningTrainingLog, MasterSetting, Trainee } from '../types.ts';
import { requestWithJsonp } from '../api.ts';
import FeedbackModal from './FeedbackModal.tsx';
import TestResultModal from './TestResultModal.tsx';
import { LoadingIcon, CloseIcon } from './Icons.tsx';

interface LogViewerProps {
    adminToken: string | null;
    masterSettings: MasterSetting[];
    trainees: Trainee[];
}

type LogType = 'roleplay' | 'test' | 'questioning';

type LogState = {
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
};

/**
 * 曖昧なキー名から値を取得（ログデータ用）
 */
const getFuzzy = (obj: any, keys: string[]) => {
    if (!obj) return '';
    const norm = (s: string) => String(s || "").replace(/[\s　]/g, '').toLowerCase();
    const targetKeys = keys.map(norm);
    const objKeys = Object.keys(obj);
    for (const k of objKeys) {
        if (targetKeys.includes(norm(k))) return obj[k];
    }
    return '';
};

// --- Client-side Data Processing ---
const processRawLogs = (rawData: { rows: any[] }, type: LogType): any[] => {
    if (!rawData || !Array.isArray(rawData.rows)) return [];
    return rawData.rows.map(log => {
        const sanitizedLog = { ...log };
        sanitizedLog.traineeName = getFuzzy(log, ["研修生名", "研修生", "traineeName", "trainee", "name"]);
        sanitizedLog.center = getFuzzy(log, ["センター", "center", "所属"]);
        sanitizedLog.timestamp = getFuzzy(log, ["実施日時", "timestamp", "startTime", "日時"]);

        if (type === 'roleplay') {
            sanitizedLog.scenarioName = getFuzzy(log, ["シナリオ名", "scenarioName", "名称"]);
            try {
                if (typeof sanitizedLog.persona === 'string' && sanitizedLog.persona.startsWith('{')) sanitizedLog.persona = JSON.parse(sanitizedLog.persona);
                if (typeof sanitizedLog.fullTranscript === 'string' && sanitizedLog.fullTranscript.startsWith('[')) sanitizedLog.fullTranscript = JSON.parse(sanitizedLog.fullTranscript);
            } catch (e) {}
            sanitizedLog.fullTranscript = Array.isArray(sanitizedLog.fullTranscript) ? sanitizedLog.fullTranscript : [];
            sanitizedLog.persona = (typeof sanitizedLog.persona === 'object' && sanitizedLog.persona !== null) ? sanitizedLog.persona : {};
            sanitizedLog.scores = (typeof log.scores === 'object' && log.scores !== null) ? log.scores : {};
        } else if (type === 'test') {
            sanitizedLog.questionText = getFuzzy(log, ["問題名", "問題", "questionText", "内容"]);
        } else if (type === 'questioning') {
            sanitizedLog.scenarioTopic = getFuzzy(log, ["トピック", "シナリオトピック", "scenarioTopic", "テーマ"]);
        }
        
        return sanitizedLog;
    });
};

const QUESTIONING_RADAR_CRITERIA = [
  { key: 'infoGathering', name: '情報収集力' },
  { key: 'hypothesis', name: '仮説構築力' },
  { key: 'technique', name: '質問技法' },
  { key: 'initiative', name: '主導権' },
  { key: 'problemId', name: '課題特定力' },
];

const QuestioningLogDetailModal: React.FC<{ log: QuestioningTrainingLog, onClose: () => void }> = ({ log, onClose }) => {
    const readableTranscript = useMemo(() => {
        const text = (log as any).transcriptText || log.transcript;
        if (!text) return '対話記録はありません。';
        if (typeof text === 'string' && (text.startsWith('[') || text.startsWith('{'))) {
            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) return parsed.map((t: any) => `${t.speaker === 'user' ? 'あなた' : '顧客'}: ${t.text}`).join('\n\n');
            } catch (e) {}
        }
        return text;
    }, [log]);

    const chartData = useMemo(() => {
        return QUESTIONING_RADAR_CRITERIA.map(criterion => ({
            subject: criterion.name,
            score: Number((log as any)[`score_${criterion.key}`]) || 0,
            fullMark: 5,
        }));
    }, [log]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto p-4 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">質問力トレーニング：実施記録</h3>
                        <p className="text-sm text-slate-500 mt-1">{log.timestamp} | 研修生: {log.traineeName} 様</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><CloseIcon /></button>
                </div>
                <div className="p-8 overflow-y-auto space-y-8">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-lg">
                                <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>スキルレーダー
                            </h4>
                             <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
                                        <Radar name="獲得スコア" dataKey="score" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.4} />
                                    </RadarChart>
                                </ResponsiveContainer>
                             </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                                <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>AIの総評・アドバイス
                            </h4>
                            <div className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 h-[260px] overflow-y-auto">{log.aiSummary}</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>対話の全記録
                        </h4>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed tracking-wide">
                                {readableTranscript}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LogViewer: React.FC<LogViewerProps> = ({ adminToken, masterSettings, trainees }) => {
    const [activeTab, setActiveTab] = useState<LogType>('roleplay');
    const [rawRolePlayLogs, setRawRolePlayLogs] = useState<SessionLog[]>([]);
    const [rawTestLogs, setRawTestLogs] = useState<TestHistoryItem[]>([]);
    const [rawQuestioningLogs, setRawQuestioningLogs] = useState<QuestioningTrainingLog[]>([]);
    const [logState, setLogState] = useState<LogState>({ status: 'idle', error: null });
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [traineeFilter, setTraineeFilter] = useState('');
    const [centerFilter, setCenterFilter] = useState('');

    const fetchLogsForType = useCallback(async (type: LogType) => {
        if (!adminToken) return;
        const dataSetter = type === 'roleplay' ? setRawRolePlayLogs : type === 'test' ? setRawTestLogs : setRawQuestioningLogs;
        const action = type === 'roleplay' ? 'getAdminRolePlayLogs' : type === 'test' ? 'getAdminTestLogs' : 'getAdminQuestioningLogs';

        setLogState({ status: 'loading', error: null });
        try {
            const response = await requestWithJsonp(action, {}, adminToken);
            if (!response?.data?.rows) throw new Error("データがありません");
            dataSetter(processRawLogs(response.data, type));
            setLogState({ status: 'success', error: null });
        } catch (e: any) {
            setLogState({ status: 'error', error: e.message });
        }
    }, [adminToken]);

    useEffect(() => { fetchLogsForType(activeTab); }, [activeTab, fetchLogsForType]);
    
    // 絞り込みオプションの生成
    const traineeOptions = useMemo(() => {
        const allLogs = [...rawRolePlayLogs, ...rawTestLogs, ...rawQuestioningLogs];
        const names = allLogs.map(l => l.traineeName).filter(Boolean);
        // マスタからも追加
        const masterNames = trainees.map(t => t.traineeName).filter(Boolean);
        return Array.from(new Set([...names, ...masterNames])).sort();
    }, [rawRolePlayLogs, rawTestLogs, rawQuestioningLogs, trainees]);

    const centerOptions = useMemo(() => {
        // マスタから取得
        const masterAbbrs = masterSettings
            .filter(s => s.displayFlag)
            .map(s => s.abbreviation)
            .filter(Boolean);
        // ログからも取得（マスタにない古いセンター名などのため）
        const allLogs = [...rawRolePlayLogs, ...rawTestLogs, ...rawQuestioningLogs];
        const logCenters = allLogs.map(l => l.center).filter(Boolean);
        return Array.from(new Set([...masterAbbrs, ...logCenters])).sort();
    }, [masterSettings, rawRolePlayLogs, rawTestLogs, rawQuestioningLogs]);

    const filteredLogs = useMemo(() => {
        const logs = activeTab === 'roleplay' ? rawRolePlayLogs : activeTab === 'test' ? rawTestLogs : rawQuestioningLogs;
        return logs.filter(log => (!traineeFilter || log.traineeName === traineeFilter) && (!centerFilter || log.center === centerFilter));
    }, [activeTab, rawRolePlayLogs, rawTestLogs, rawQuestioningLogs, traineeFilter, centerFilter]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">研修生名で絞り込み</label>
                    <select value={traineeFilter} onChange={e => setTraineeFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer border-none shadow-inner">
                        <option value="">すべて表示</option>
                        {traineeOptions.map(name => <option key={name} value={name}>{name} 様</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">所属センターで絞り込み</label>
                    <select value={centerFilter} onChange={e => setCenterFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer border-none shadow-inner">
                        <option value="">すべて表示</option>
                        {centerOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <nav className="flex border-b border-slate-200 bg-slate-50/50">
                    {['roleplay', 'test', 'questioning'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-4 px-6 font-bold text-sm transition-all border-b-2 ${activeTab === t ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            {t === 'roleplay' ? 'RP' : t === 'test' ? 'テスト' : '質問力'}
                        </button>
                    ))}
                </nav>
                <div className="p-2">
                    {logState.status === 'loading' ? (
                        <div className="py-20 flex flex-col items-center gap-3"><LoadingIcon className="h-8 w-8 text-indigo-500" /><p className="text-sm font-bold text-slate-400 animate-pulse">読み込み中...</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">実施日時</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">研修生</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">内容</th>
                                        <th className="relative px-6 py-4"><span className="sr-only">詳細</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{log.timestamp}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{log.traineeName}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-md">{(log as any).scenarioName || (log as any).questionText || (log as any).scenarioTopic}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                                <button onClick={() => setSelectedLog(log)} className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">詳細</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold">記録が見つかりませんでした。</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            {selectedLog && activeTab === 'roleplay' && <FeedbackModal feedback={selectedLog} onClose={() => setSelectedLog(null)} />}
            {selectedLog && activeTab === 'test' && <TestResultModal result={selectedLog} onClose={() => setSelectedLog(null)} />}
            {selectedLog && activeTab === 'questioning' && <QuestioningLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
};
