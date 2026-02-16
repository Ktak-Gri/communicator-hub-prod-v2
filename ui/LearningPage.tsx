
import React from 'react';
import { PencilIcon, ArrowLeftIcon, SparklesIcon, BookOpenIcon } from './Icons.tsx';
import { ActivePage } from '../types.ts';

const LearningPage: React.FC<{ onNavigate: (page: ActivePage) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
        <div className="flex flex-row items-center">
            <button onClick={() => onNavigate('home')} className="flex flex-row items-center gap-1.5 text-xs font-black text-slate-400 hover:text-sky-600 transition-all group px-2 whitespace-nowrap">
                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                <span className="leading-none">← 戻る</span>
            </button>
        </div>
        <div className="text-left px-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter">学習プログラム</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Select Module</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
            <div onClick={() => onNavigate('learning-test')} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:shadow-xl cursor-pointer group relative overflow-hidden transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <BookOpenIcon className="h-10 w-10 text-sky-500 mb-4 relative z-10" />
                <h3 className="text-lg font-black text-slate-800 mb-1 relative z-10">知識テスト</h3>
                <p className="text-slate-500 text-xs font-bold relative z-10 leading-relaxed">現行プラン（MAX/mini等）の仕様をクイズ形式で完璧に習得します。</p>
            </div>
            <div onClick={() => onNavigate('learning-trainer')} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:shadow-xl cursor-pointer group relative overflow-hidden transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <SparklesIcon className="h-10 w-10 text-emerald-500 mb-4 relative z-10" />
                <h3 className="text-lg font-black text-slate-800 mb-1 relative z-10">対話戦略トレーニング</h3>
                <p className="text-slate-500 text-xs font-bold relative z-10 leading-relaxed">顧客の曖昧な発言を深掘りし、真のニーズを引き出す「質問力」を鍛えます。</p>
            </div>
        </div>
    </div>
  );
};
export default LearningPage;
