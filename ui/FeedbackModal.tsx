
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { FeedbackData } from '../types.ts';
import { CloseIcon, LightBulbIcon } from './Icons.tsx';

const RADAR_CRITERIA = [
  { key: 'listeningSkill', name: '傾聴力' },
  { key: 'empathy', name: '共感力' },
  { key: 'accuracy', name: '正確性' },
  { key: 'problemSolving', name: '解決力' },
  { key: 'summarization', name: '要約力' },
  { key: 'politeness', name: '敬語' },
];

const FeedbackModal: React.FC<{ feedback: FeedbackData; onClose: () => void }> = ({ feedback, onClose }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');

    const chartData = useMemo(() => {
        if (!feedback.scores) return [];
        return RADAR_CRITERIA.map(criterion => ({
            subject: criterion.name,
            score: feedback.scores[criterion.key] || 0,
            fullMark: 5,
        }));
    }, [feedback.scores]);

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-3 animate-fade-in">
            <div className="bg-slate-50 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 leading-none">トレーニング結果レポート</h2>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">{feedback.traineeName} 様 ({feedback.center})</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><CloseIcon className="h-5 w-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <nav className="flex border-b border-slate-200 mb-4">
                        <button onClick={() => setActiveTab('summary')} className={`px-6 py-2 text-xs font-black transition-all ${activeTab === 'summary' ? 'border-b-4 border-sky-500 text-sky-600 bg-sky-50/30' : 'text-slate-400'}`}>分析サマリー</button>
                        <button onClick={() => setActiveTab('transcript')} className={`px-6 py-2 text-xs font-black transition-all ${activeTab === 'transcript' ? 'border-b-4 border-sky-500 text-sky-600 bg-sky-50/30' : 'text-slate-400'}`}>全会話ログ</button>
                    </nav>

                    {activeTab === 'summary' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center shadow-sm">
                                <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Skill Analysis Chart</h3>
                                <div className="h-[240px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                            <PolarGrid stroke="#f1f5f9" />
                                            <PolarAngleAxis dataKey="subject" tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} />
                                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                            <Radar name="スコア" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-1 text-[9px] font-black text-slate-400">TOTAL SCORE: <span className="text-sky-600 text-lg">{feedback.totalScore}</span> / 30</div>
                            </div>
                            <div className="space-y-3">
                                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-full -mr-8 -mt-8 blur-2xl opacity-40"></div>
                                    <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1.5 relative z-10">
                                        <LightBulbIcon className="h-3.5 w-3.5 text-amber-500" />
                                        AI総合フィードバック
                                    </h3>
                                    <p className="text-slate-600 text-[12px] font-bold leading-relaxed whitespace-pre-wrap relative z-10">{feedback.summary}</p>
                                </div>
                                {feedback.keigoFeedback && (
                                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <h3 className="text-[9px] font-black text-emerald-600 uppercase mb-1">言葉遣いへの助言</h3>
                                        <p className="text-emerald-900 text-[11px] font-bold leading-snug">{feedback.keigoFeedback}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'transcript' && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-fade-in max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {feedback.fullTranscript.map((t, idx) => (
                                <div key={idx} className={`flex flex-col ${t.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[8px] font-black text-slate-300 mb-0.5 uppercase tracking-tighter">{t.speaker === 'user' ? 'Training Staff' : 'Customer'}</span>
                                    <div className={`p-2.5 px-4 rounded-xl text-[12px] font-bold leading-snug shadow-sm max-w-[90%] ${t.speaker === 'user' ? 'bg-sky-50 text-sky-800 rounded-tr-none' : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'}`}>{t.text}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
