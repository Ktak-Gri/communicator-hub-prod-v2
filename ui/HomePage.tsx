
import React from 'react';
import { HeadsetIcon, BookOpenIcon, HistoryIcon, UserCircleIcon, GlobeAltIcon, PhoneIcon } from './Icons.tsx';
import { ActivePage } from '../types.ts';

const NavCard = ({ title, description, icon, onClick, accent }: any) => {
    const colors: any = {
        sky: "text-sky-600 bg-sky-50 hover:border-sky-200",
        indigo: "text-indigo-600 bg-indigo-50 hover:border-indigo-200",
        amber: "text-amber-600 bg-amber-50 hover:border-amber-200",
        emerald: "text-emerald-600 bg-emerald-50 hover:border-emerald-200",
        slate: "text-slate-600 bg-slate-50 hover:border-slate-200",
        rose: "text-rose-600 bg-rose-50 hover:border-rose-200"
    };
    return (
        <div onClick={onClick} className={`group bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg ${colors[accent]}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${colors[accent].split(' ')[0]} ${colors[accent].split(' ')[1]}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5" })}
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight leading-tight">{title}</h3>
            <p className="text-slate-500 text-[11px] font-bold leading-snug">{description}</p>
        </div>
    );
};

const HomePage: React.FC<{ onNavigate: (p: ActivePage) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6 animate-fade-in">
        <div className="text-center space-y-1.5">
            <div className="inline-block px-3 py-1 bg-slate-900 text-sky-400 text-[9px] font-black rounded-full tracking-widest shadow-md">
               PROFESSIONAL AI TRAINING HUB
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">研修メニュー</h2>
            <p className="text-slate-400 font-bold text-[12px] max-w-md mx-auto leading-none">AI技術を駆使した最短の実践スキル習得プログラム</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 px-4 sm:px-0">
            <NavCard title="AIロープレ" description="Gemini Liveによる超低遅延対話。顧客感情をリアルに再現。" icon={<HeadsetIcon />} accent="sky" onClick={() => onNavigate('roleplay')} />
            {/* FIX: 'one-on-one' is now a valid ActivePage value */}
            <NavCard title="1 on 1 通話" description="研修生同士のリアルタイム対話をAIが客観分析。" icon={<PhoneIcon />} accent="indigo" onClick={() => onNavigate('one-on-one')} />
            <NavCard title="知識テスト" description="Google検索連携により、常に最新プラン情報を学習。" icon={<BookOpenIcon />} accent="amber" onClick={() => onNavigate('learning')} />
            <NavCard title="研修記録" description="成長曲線を可視化し、得意・不得意を統合解析。" icon={<HistoryIcon />} accent="emerald" onClick={() => onNavigate('history')} />
            <NavCard title="業務一覧" description="全センターの最新業務と略称を網羅したリファレンス。" icon={<GlobeAltIcon />} accent="slate" onClick={() => onNavigate('center-summary')} />
            <NavCard title="個人設定" description="所属センター変更。AI提示内容を自動最適化。" icon={<UserCircleIcon />} accent="rose" onClick={() => onNavigate('center-registration')} />
        </div>
    </div>
  );
};
export default HomePage;
