
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
        <div onClick={onClick} className={`group bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm transition-all cursor-pointer hover:-translate-y-1.5 hover:shadow-xl ${colors[accent]}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${colors[accent].split(' ')[0]} ${colors[accent].split(' ')[1]}`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: "h-7 w-7" })}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight leading-tight">{title}</h3>
            <p className="text-slate-500 text-sm font-bold leading-relaxed">{description}</p>
            <div className="mt-5 text-sky-600 font-black text-xs opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 translate-x-2 group-hover:translate-x-0">
               開始する <span className="text-lg leading-none">→</span>
            </div>
        </div>
    );
};

const HomePage: React.FC<{ onNavigate: (p: ActivePage) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto py-10 space-y-10 animate-fade-in">
        <div className="text-center space-y-3">
            <div className="inline-block px-4 py-1 bg-slate-900 text-sky-400 text-[10px] font-black rounded-full tracking-[0.3em] shadow-sm uppercase">
               Professional Training Hub
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">研修メニュー</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
            <NavCard title="AIロープレ" description="Gemini Liveによる超低遅延対話。顧客感情をリアルに再現し、実践的なスキルを習得。" icon={<HeadsetIcon />} accent="sky" onClick={() => onNavigate('roleplay')} />
            <NavCard title="1 on 1 通話" description="研修生同士のリアルタイム対話をAIが客観分析。相互フィードバックを支援。" icon={<PhoneIcon />} accent="indigo" onClick={() => onNavigate('one-on-one')} />
            <NavCard title="知識テスト" description="Google検索連携により、常に最新プラン情報を学習。クイズ形式で知識を定着。" icon={<BookOpenIcon />} accent="amber" onClick={() => onNavigate('learning')} />
            <NavCard title="研修記録" description="成長曲線を可視化し、得意・不得意を統合解析。過去の全セッションを参照可能。" icon={<HistoryIcon />} accent="emerald" onClick={() => onNavigate('history')} />
            <NavCard title="業務一覧" description="全センターの最新業務と略称を網羅。日々の業務のリファレンスとして活用。" icon={<GlobeAltIcon />} accent="slate" onClick={() => onNavigate('center-summary')} />
            <NavCard title="個人設定" description="所属センターの管理。所属に合わせてAIが提示する内容を自動で最適化。" icon={<UserCircleIcon />} accent="rose" onClick={() => onNavigate('center-registration')} />
        </div>
    </div>
  );
};
export default HomePage;
