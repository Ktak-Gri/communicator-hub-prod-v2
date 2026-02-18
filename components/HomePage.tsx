
import React from 'react';
import { HeadsetIcon, BookOpenIcon, HistoryIcon, UserCircleIcon, GlobeAltIcon, PhoneIcon } from './Icons.tsx';
import { ActivePage } from '../types.ts';

interface NavCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent: "sky" | "emerald" | "amber" | "indigo" | "slate" | "rose";
}

const NavCard: React.FC<NavCardProps> = ({ title, description, icon, onClick, accent }) => {
    const colors = {
        sky: "text-sky-600 bg-sky-50",
        emerald: "text-emerald-600 bg-emerald-50",
        amber: "text-amber-600 bg-amber-50",
        indigo: "text-indigo-600 bg-indigo-50",
        slate: "text-slate-600 bg-slate-50",
        rose: "text-rose-600 bg-rose-50"
    };

    const hoverColors = {
        sky: "hover:border-sky-500/50 hover:shadow-sky-500/10",
        emerald: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
        amber: "hover:border-amber-500/50 hover:shadow-amber-500/10",
        indigo: "hover:border-indigo-500/50 hover:shadow-indigo-500/10",
        slate: "hover:border-slate-500/50 hover:shadow-slate-500/10",
        rose: "hover:border-rose-500/50 hover:shadow-rose-500/10"
    };

    return (
        <div 
            onClick={onClick} 
            className={`group relative bg-white/80 backdrop-blur-xl px-8 py-7 rounded-[2rem] border border-slate-200 shadow-sm transition-all duration-500 cursor-pointer overflow-hidden ${hoverColors[accent]} hover:-translate-y-1.5 min-h-[220px] flex flex-col`}
        >
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`w-12 h-12 -mr-6 -mt-6 rounded-full blur-xl ${colors[accent].split(' ')[1]}`}></div>
            </div>

            <div className="flex flex-col h-full space-y-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 ${colors[accent]}`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: "h-7 w-7" })}
                </div>
                <div className="flex-grow">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight">{title}</h3>
                    {/* フォントサイズを拡大 (13.3インチPC対応) */}
                    <p className="text-slate-600 text-base font-bold leading-relaxed mt-3 group-hover:text-slate-900 transition-colors">
                        {description}
                    </p>
                </div>
                <div className="pt-2 flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    モジュールを開始 <span className="text-lg leading-none">→</span>
                </div>
            </div>
        </div>
    );
};

interface HomePageProps {
  onNavigate: (page: ActivePage | any) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-10 animate-fade-in max-w-6xl mx-auto pb-20 pt-6">
        <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
            <div className="inline-block px-5 py-1.5 bg-slate-900 rounded-full text-[10px] font-black text-sky-400 uppercase tracking-[0.4em] shadow-2xl mb-2 animate-bounce-slow">
                Professional AI Training Hub
            </div>
            {/* キャッチコピーを削除し、タイトルをシンプルに */}
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                研修メニュー
            </h2>
            <p className="text-slate-400 font-bold leading-relaxed text-sm sm:text-base max-w-xl mx-auto">
                各モジュールから実践的なスキルアップを行いましょう。
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            <NavCard 
                title="AIロープレ" 
                description="Gemini Liveによる超低遅延ボイス対話。顧客の感情や知識レベルをリアルに再現します。" 
                icon={<HeadsetIcon />}
                accent="sky"
                onClick={() => onNavigate('roleplay')}
            />
            <NavCard 
                title="1 on 1 ロープレ" 
                description="研修生同士でリアルタイムに通話。AIが客観的に会話を分析し、改善点を抽出します。" 
                icon={<PhoneIcon />}
                accent="indigo"
                onClick={() => onNavigate('one-on-one')}
            />
            <NavCard 
                title="学習テスト" 
                description="最新プラン対応の動的なテスト。Google検索との連携により最新情報を学習可能です。" 
                icon={<BookOpenIcon />}
                accent="amber"
                onClick={() => onNavigate('learning')}
            />
            <NavCard 
                title="研修記録" 
                description="過去の全セッションをAIが統合解析。成長曲線や得意・不得意を可視化します。" 
                icon={<HistoryIcon />}
                accent="emerald"
                onClick={() => onNavigate('history')}
            />
            <NavCard 
                title="業務一覧" 
                description="全センターの最新業務範囲と略称を網羅。日々の業務のリファレンスとしても最適です。" 
                icon={<GlobeAltIcon />}
                accent="slate"
                onClick={() => onNavigate('center-summary')}
            />
            <NavCard 
                title="個人設定" 
                description="所属センターの管理。所属に合わせてAIが提示する内容を自動で最適化します。" 
                icon={<UserCircleIcon />}
                accent="rose"
                onClick={() => onNavigate('center-registration')}
            />
        </div>

        <div className="mt-16 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Integrated System V6.32 | Gemini Core</p>
        </div>
    </div>
  );
};

export default HomePage;
