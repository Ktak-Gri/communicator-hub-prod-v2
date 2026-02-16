
import React from 'react';
import { HeadsetIcon, PencilIcon, ArrowLeftIcon } from './Icons.tsx';
import { ActivePage } from '../types.ts';

interface LearningPageProps {
  onNavigate: (page: ActivePage) => void;
}

const LearningCard: React.FC<{ title: string; description: string; icon: React.ReactNode; buttonLabel: string; accent: "sky" | "emerald"; onClick: () => void; }> = 
({ title, description, icon, buttonLabel, onClick, accent }) => {
    const styles = {
        sky: {
            icon: "bg-sky-50 text-sky-600 border-sky-100",
            button: "bg-sky-600 hover:bg-sky-700 shadow-sky-100",
            border: "hover:border-sky-200"
        },
        emerald: {
            icon: "bg-emerald-50 text-emerald-600 border-emerald-100",
            button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
            border: "hover:border-emerald-200"
        }
    };

    return (
        <div className={`bg-white p-8 rounded-3xl shadow-sm border border-slate-200 transition-all hover:shadow-xl ${styles[accent].border} flex flex-col md:flex-row items-center gap-8 group`}>
            <div className={`p-6 rounded-2xl border transition-transform group-hover:scale-105 ${styles[accent].icon}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: "h-10 w-10" })}
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-bold">{description}</p>
            </div>
            <div className="w-full md:w-auto">
                <button
                    onClick={onClick}
                    className={`w-full md:w-auto ${styles[accent].button} text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg transform active:scale-95 whitespace-nowrap cursor-pointer`}
                >
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
};


const LearningPage: React.FC<LearningPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
        <div className="mb-6">
            <button 
                onClick={() => onNavigate('home')} 
                className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-sky-600 transition-colors cursor-pointer group"
            >
                <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> 
                <span>ホームへ戻る</span>
            </button>
        </div>

        <div className="mb-10">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-amber-500 rounded-full"></span>
                学習メニューを選択
            </h2>
            <p className="text-slate-400 font-bold text-xs mt-2 ml-4.5 uppercase tracking-widest">Select Learning Module</p>
        </div>

        <div className="space-y-6">
            <LearningCard
              title="知識テスト"
              icon={<PencilIcon />}
              description="AIが動的に生成する一問一答テスト。応対に必要なプラン知識やセンター固有のルールをクイズ形式で定着させます。"
              buttonLabel="テストを開始"
              accent="sky"
              // FIX: Type exists in updated ActivePage
              onClick={() => onNavigate('learning-test')}
            />
            <LearningCard
              title="対話戦略トレーニング"
              icon={<HeadsetIcon />}
              description="顧客の曖昧な発言から潜在ニーズを引き出す「質問力」に特化した対話練習。AIが質問の種類をリアルタイム分析します。"
              buttonLabel="練習を開始"
              accent="emerald"
              // FIX: Type exists in updated ActivePage
              onClick={() => onNavigate('learning-trainer')}
            />
        </div>
    </div>
  );
};

export default LearningPage;
