
import React from 'react';
import { Cog6ToothIcon, ArrowLeftIcon } from './Icons.tsx';

const MonorepoGuide: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 text-left">
            <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-sky-500 transition-all group">
                <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 戻る
            </button>
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-6">
                    <Cog6ToothIcon className="h-12 w-12 text-sky-400" />
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter">Architecture Guide</h2>
                        <p className="text-slate-400 text-sm mt-1 font-bold">モノレポ構成とスケーラビリティについて</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm leading-relaxed text-slate-600 font-bold">
                <p>本システムは小規模から大規模まで拡張可能なコンポーネント指向で設計されています。各機能は独立したHookとUIで構成されており、将来的なバックエンドのNode.js移行や独立したマイクロサービス化にも容易に対応可能です。</p>
            </div>
        </div>
    );
};
export default MonorepoGuide;
