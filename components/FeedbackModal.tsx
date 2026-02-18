import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { FeedbackData, DetailedComments, Persona, TranscriptItem } from '../types.ts';
import { CloseIcon, TranscriptIcon, UserCircleIcon, PauseIcon, MicIcon, LightBulbIcon } from './Icons.tsx';

interface FeedbackModalProps {
  feedback: FeedbackData;
  onClose: () => void;
}

const RADAR_CRITERIA = [
  { key: 'listeningSkill', name: '傾聴力' },
  { key: 'empathy', name: '共感力' },
  { key: 'accuracy', name: '正確性' },
  { key: 'problemSolving', name: '問題解決力' },
  { key: 'summarization', name: '要約力' },
  { key: 'politeness', name: '敬語' },
  { key: 'cushionWords', name: 'クッション言葉' },
  { key: 'intonation', name: '抑揚' },
];

const DETAILED_SCORE_CRITERIA = [
  { key: 'openingGreeting', name: '応答挨拶' },
  { key: 'selfIntroduction', name: '名乗り' },
  { key: 'callThanks', name: 'コールお礼' },
  { key: 'customerVerification', name: '本人確認' },
  { key: 'requirementDefinition', name: '要件確定' },
  { key: 'clarification', name: '不明点確認' },
  { key: 'closingThanks', name: '終話時のお礼' },
  { key: 'closingSelfIntroduction', name: '終話時名乗り' },
  { key: 'politeness', name: '敬語' },
  { key: 'voiceTone', name: '声のトーン' },
  { key: 'intonation', name: '抑揚' },
];

const formatSeconds = (seconds: number | undefined) => {
    const numSeconds = Number(seconds);
    if (seconds == null || isNaN(numSeconds) || numSeconds < 0) {
        return 'N/A';
    }
    const m = Math.floor(numSeconds / 60);
    const s = Math.round(numSeconds % 60);
    return `${m}分 ${s}秒`;
};

const MetricCard: React.FC<{ label: string; value: string | number; unit?: string; icon?: React.ReactNode }> = ({ label, value, unit, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex items-start">
        {icon && <div className="mr-3 text-sky-500">{icon}</div>}
        <div>
            <h4 className="font-semibold text-slate-600 text-sm">{label}</h4>
            <p className="text-2xl font-bold text-slate-800">
                {value} <span className="text-base font-medium text-slate-500">{unit}</span>
            </p>
        </div>
    </div>
);

const ScoreRating: React.FC<{ score: number | undefined }> = ({ score = 0 }) => (
    <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => <span key={i} className="text-lg">{i < score ? '★' : '☆'}</span>)}
    </div>
);

const TranscriptViewer: React.FC<{ transcript: TranscriptItem[] }> = ({ transcript }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto bg-slate-100 p-4 rounded-md">
        {transcript.map((item, index) => {
            const speakerName = item.speaker === 'user' ? 'あなた' : 'AI顧客';
            const speakerClass = item.speaker === 'user' ? 'text-sky-700' : 'text-slate-500';
            const messageClass = item.speaker === 'user' ? 'bg-sky-100 text-sky-900' : 'bg-white text-slate-800';
            const alignmentClass = item.speaker === 'user' ? 'items-end' : 'items-start';

            return (
                <div key={index} className={`flex flex-col ${alignmentClass}`}>
                    <span className={`text-xs font-bold ${speakerClass}`}>{speakerName}</span>
                    <div className={`max-w-xl p-3 rounded-lg ${messageClass}`}>
                        <p>{item.text}</p>
                    </div>
                </div>
            );
        })}
    </div>
);


const FeedbackModal: React.FC<FeedbackModalProps> = ({ feedback, onClose }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'transcript'>('summary');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const chartData = useMemo(() => {
        if (!feedback.scores) return [];
        return RADAR_CRITERIA.map(criterion => ({
            subject: criterion.name,
            score: feedback.scores[criterion.key] || 0,
            fullMark: 5,
        }));
    }, [feedback.scores]);

    const personaProfile = useMemo(() => {
        if (!feedback.persona) return 'N/A';
        const { personality, ageGroup, knowledgeLevel } = feedback.persona;
        const parts = [
            personality,
            ageGroup,
        ].filter(Boolean);
        
        if (parts.every(p => !p || p === 'N/A')) {
            const knowledgeProfile = (knowledgeLevel && knowledgeLevel !== 'N/A') ? `知識レベル: ${knowledgeLevel}` : null;
            return knowledgeProfile || 'ペルソナ情報なし';
        }
        const mainProfile = parts.join(' / ');
        const knowledgeProfile = (knowledgeLevel && knowledgeLevel !== 'N/A') ? `知識レベル: ${knowledgeLevel}` : null;
        return [mainProfile, knowledgeProfile].filter(Boolean).join(' / ');
    }, [feedback.persona]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-30 overflow-y-auto p-4 sm:p-8" onClick={onClose}>
            <div role="dialog" aria-modal="true" className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-6xl my-24 mx-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">ロールプレイング結果</h2>
                        <p className="text-sm text-slate-500">{feedback.startTime} - {feedback.traineeName} ({feedback.center})</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                
                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Scenario Info */}
                    <div className="p-4 bg-white rounded-lg shadow-sm border">
                        <h3 className="font-semibold text-slate-700 mb-2">シナリオ概要</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p><strong>シナリオ名:</strong> {feedback.scenarioName}</p>
                                <p><strong>最初の問合せ:</strong> {feedback.scenarioInitialInquiry}</p>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                                <UserCircleIcon className="h-6 w-6 text-slate-500 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-slate-600">AI顧客ペルソナ</p>
                                    <p className="text-xs text-slate-500">{personaProfile}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Call Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <MetricCard label="対応時間" value={formatSeconds(feedback.callDuration)} />
                        <MetricCard label="保留" value={feedback.holdCount || 0} unit="回" icon={<PauseIcon />} />
                        <MetricCard label="総保留時間" value={formatSeconds(feedback.totalHoldTime)} />
                        <MetricCard label="フィラー" value={feedback.fillerCount || 0} unit="回" />
                        <MetricCard label="NGワード" value={feedback.ngWordCount || 0} unit="回" />
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => setActiveTab('summary')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'summary' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>総合評価</button>
                            <button onClick={() => setActiveTab('details')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'details' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>詳細スコア</button>
                            <button onClick={() => setActiveTab('transcript')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'transcript' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>会話ログ</button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'summary' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-lg shadow-sm border">
                                <h3 className="font-semibold text-slate-700 mb-4 text-center">スキル評価チャート</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} />
                                        <Radar name="スコア" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                <div className="p-6 bg-white rounded-lg shadow-sm border">
                                    <div className="flex items-center gap-2 mb-2">
                                       <LightBulbIcon className="h-6 w-6 text-amber-500" />
                                       <h3 className="font-semibold text-slate-700">AIによる総合評価</h3>
                                    </div>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{feedback.summary}</p>
                                </div>
                                 <div className="p-4 bg-white rounded-lg shadow-sm border">
                                    <h3 className="font-semibold text-slate-700 mb-2">敬語・言葉遣いフィードバック</h3>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{feedback.keigoFeedback || '特に指摘事項はありませんでした。'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'details' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
                             <h3 className="font-semibold text-slate-700 mb-4">項目別スコア</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                {DETAILED_SCORE_CRITERIA.map(item => (
                                    <div key={item.key} className="flex justify-between items-center p-2 border-b">
                                        <span className="text-sm text-slate-600">{item.name}</span>
                                        <ScoreRating score={feedback.scores[item.key]} />
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {activeTab === 'transcript' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
                           <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <TranscriptIcon />
                                <span>会話ログ</span>
                           </h3>
                           <TranscriptViewer transcript={feedback.fullTranscript} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;