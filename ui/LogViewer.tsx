
import React, { useState, useEffect, useCallback } from 'react';
import { MasterSetting, Trainee } from '../types.ts';
import { requestWithJsonp } from '../api.ts';
import FeedbackModal from './FeedbackModal.tsx';
import TestResultModal from './TestResultModal.tsx';
import { LoadingIcon } from './Icons.tsx';

interface LogViewerProps {
    adminToken: string | null;
    masterSettings: MasterSetting[];
    trainees: Trainee[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ adminToken }) => {
    const [activeTab, setActiveTab] = useState<'roleplay' | 'test'>('roleplay');
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchLogs = useCallback(async () => {
        if (!adminToken) return;
        setIsLoading(true);
        try {
            const action = activeTab === 'roleplay' ? 'getAdminRolePlayLogs' : 'getAdminTestLogs';
            const res = await requestWithJsonp(action, {}, adminToken);
            if (res.data?.rows) {
                setLogs(res.data.rows.map((row: any) => ({
                    ...row,
                    traineeName: row.研修生名 || row.研修生 || row.traineeName || "Unknown",
                    scenarioName: row.シナリオ名 || row.scenarioName || row.問題名 || "N/A",
                    timestamp: row.実施日時 || row.timestamp || "N/A"
                })).reverse());
            } else {
                setLogs([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, adminToken]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <div className="space-y-4">
            <div className="flex border-b border-slate-100">
                {['roleplay', 'test'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 font-black text-xs transition-all ${activeTab === t ? 'border-b-4 border-sky-600 text-sky-700 bg-sky-50/20' : 'text-slate-400 hover:text-slate-600'}`}>
                        {t === 'roleplay' ? 'ロールプレイ履歴' : 'テスト履歴'}
                    </button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
                {isLoading ? <div className="py-20 text-center"><LoadingIcon className="mx-auto text-sky-500 h-8 w-8" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left">
                            <thead className="bg-slate-50 text-[9px] uppercase tracking-widest font-black text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">日時</th>
                                    <th className="px-5 py-3">研修生</th>
                                    <th className="px-5 py-3">実施内容</th>
                                    <th className="px-5 py-3 text-right">詳細</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.length > 0 ? logs.map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3 font-mono text-slate-400">{log.timestamp}</td>
                                        <td className="px-5 py-3 font-black text-slate-700">{log.traineeName}</td>
                                        <td className="px-5 py-3 text-slate-500 truncate max-w-[200px]">{log.scenarioName}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button onClick={() => setSelectedLog(log)} className="text-sky-600 font-black hover:underline bg-sky-50 px-3 py-1 rounded-lg">表示</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="px-5 py-20 text-center text-slate-300 font-bold italic">ログデータがありません</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {selectedLog && activeTab === 'roleplay' && <FeedbackModal feedback={selectedLog} onClose={() => setSelectedLog(null)} />}
            {selectedLog && activeTab === 'test' && <TestResultModal result={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
};
