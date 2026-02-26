import React from 'react';
import { Card } from './ui-shared.tsx';
import { HeadsetIcon, BookOpenIcon, HistoryIcon, UserCircleIcon, GlobeAltIcon, PhoneIcon } from './ui-shared.tsx';

/**
 * Gold Build 規格のナビゲーションカード
 */
const NavCard = ({ title, description, icon, onClick, accent }: any) => {
    const colors: any = { 
      sky: "text-sky-600 bg-sky-50 border-sky-100", 
      amber: "text-amber-600 bg-amber-50 border-amber-100", 
      emerald: "text-emerald-600 bg-emerald-50 border-emerald-100", 
      indigo: "text-indigo-600 bg-indigo-50 border-indigo-100", 
      slate: "text-slate-600 bg-slate-50 border-slate-100", 
      rose: "text-rose-600 bg-rose-50 border-rose-100" 
    };
    
    return (
        <Card onClick={onClick} className="group hover:-translate-y-1.5 transition-all duration-300 min-h-[220px] flex flex-col justify-between overflow-hidden">
            <div className="space-y-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm border ${colors[accent]}`}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight">{title}</h3>
                  <p className="text-slate-500 text-[13px] font-bold leading-relaxed mt-2">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4 group-hover:text-sky-500 transition-colors">
              Module Start <span className="text-lg leading-none">→</span>
            </div>
        </Card>
    );
};

export const HomeView = ({ onNavigate }: any) => (
  <div className="max-w-6xl mx-auto py-8 space-y-10 animate-fade-in px-4">
    <div className="text-center space-y-2">
        <div className="inline-block px-4 py-1.5 bg-slate-900 rounded-full text-[9px] font-black text-sky-400 uppercase tracking-[0.3em] shadow-xl mb-2">
          Professional AI Training Hub
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">研修メニュー</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NavCard title="AIロープレ" description="Gemini Liveによる超低遅延ボイス対話。顧客の感情や知識レベルをリアルに再現します。" accent="sky" onClick={() => onNavigate('roleplay')} icon={<HeadsetIcon className="w-7 h-7" />} />
        <NavCard title="1 on 1 通話" description="研修生同士でリアルタイムに通話。AIが客観的に会話を分析し、改善点を抽出します。" accent="indigo" onClick={() => onNavigate('one-on-one')} icon={<PhoneIcon className="w-7 h-7" />} />
        <NavCard title="知識テスト" description="Google検索連携により、常に最新プラン情報をクイズ形式で学習可能です。" accent="amber" onClick={() => onNavigate('learning')} icon={<BookOpenIcon className="w-7 h-7" />} />
        <NavCard title="研修記録" description="過去の全セッションをAIが統合解析。成長曲線や得意・不得意を可視化します。" accent="emerald" onClick={() => onNavigate('history')} icon={<HistoryIcon className="w-7 h-7" />} />
        <NavCard title="業務一覧" description="全センターの最新業務範囲と略称を網羅。日々の業務のリファレンスとしても最適。" accent="slate" onClick={() => onNavigate('center-summary')} icon={<GlobeAltIcon className="w-7 h-7" />} />
        <NavCard title="個人設定" description="所属センター変更。所属に合わせてAIが提示する内容を自動で最適化します。" accent="rose" onClick={() => onNavigate('center-registration')} icon={<UserCircleIcon className="w-7 h-7" />} />
    </div>
  </div>
);

export const HistoryView = ({ onBack }: any) => (
  <div className="max-w-4xl mx-auto py-10 space-y-6">
    <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-sky-600 transition-all uppercase tracking-widest">← 戻る</button>
    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300 font-black italic shadow-inner">実施履歴データはありません</div>
  </div>
);

export const RegistrationView = ({ masters, onSelect, onBack }: any) => (
  <div className="max-w-xl mx-auto py-10 space-y-6">
    <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-sky-600 transition-all uppercase tracking-widest">← 戻る</button>
    <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-6">
        <h2 className="text-2xl font-black text-slate-800 text-center tracking-tight">所属センターの設定</h2>
        <div className="space-y-2">
            {masters.filter((m: any) => m.displayFlag).map((m: any) => (
                <button key={m.abbreviation} onClick={() => onSelect(m.abbreviation)} className="w-full p-5 text-left font-black rounded-2xl bg-slate-50 border-2 border-transparent hover:border-sky-500 hover:bg-sky-50 transition-all flex justify-between items-center group">
                    <span>🏢 {m.name}</span>
                    <span className="text-slate-300 text-xs group-hover:text-sky-500 font-bold">({m.abbreviation})</span>
                </button>
            ))}
        </div>
    </div>
  </div>
);