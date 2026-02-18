
import React from 'react';
import { GlobeAltIcon, ArrowPathIcon, CheckCircleIcon, ClipboardIcon, ShieldCheckIcon, InformationCircleIcon, PencilIcon } from './Icons.tsx';
import { WEB_APP_URL, SPREADSHEET_ID, APP_VERSION, REQUIRED_BACKEND_VERSION } from '../constants.ts';

const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label }) => (
    <div className="relative group mt-2 text-left">
        {label && <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{label}</p>}
        <pre className="bg-slate-900 text-emerald-400 p-5 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border-2 border-slate-700 shadow-inner">
            {code}
        </pre>
        <button 
            onClick={() => { navigator.clipboard.writeText(code); alert('コピーしました。'); }}
            className="absolute top-10 right-3 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all border border-slate-600 flex items-center gap-1.5 shadow-lg active:scale-95"
        >
            <ClipboardIcon className="h-4 w-4" />
            <span className="text-xs font-black uppercase">Copy</span>
        </button>
    </div>
);

const DeploymentGuide: React.FC = () => {
    const recoveryCode = `export const WEB_APP_URL = '${WEB_APP_URL}';\nexport const SPREADSHEET_ID = '${SPREADSHEET_ID}';\nexport const APP_VERSION = '${APP_VERSION}';\nexport const REQUIRED_BACKEND_VERSION = '${REQUIRED_BACKEND_VERSION}';`;

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto text-left">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden border border-slate-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20">
                        <GlobeAltIcon className="h-10 w-10 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">Maintenance & Recovery Center</h3>
                        <p className="text-sky-200 text-sm mt-1 font-bold">システム公開・復元ガイド (V6.33.02 - Gold)</p>
                    </div>
                </div>
            </div>

            {/* 緊急復元スナップショット */}
            <div className="bg-white border-[6px] border-amber-100 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Snapshot Data</div>
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-3">
                    <ArrowPathIcon className="h-8 w-8 text-amber-500" />
                    ロールバック用スナップショット
                </h4>
                <p className="text-slate-500 font-bold mb-6 leading-relaxed text-sm">
                    公開作業中に設定が混濁した場合、以下のコードを <code>constants.ts</code> にそのまま貼り付けてください。現在の「正常動作が確認されている設定」に即座に復帰できます。
                </p>
                <CodeBlock code={recoveryCode} label="RECOVERY CODE FOR constants.ts" />
            </div>

            {/* 緊急復元手順 */}
            <div className="bg-rose-600 border-[6px] border-rose-200 p-8 rounded-[2.5rem] shadow-2xl text-white">
                <h4 className="text-2xl font-black mb-4 flex items-center gap-3">
                    <ShieldCheckIcon className="h-8 w-8" />
                    トラブルシューティング
                </h4>
                <div className="space-y-4">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/20">
                        <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-3">1. 通信エラー (GAS接続失敗) が起きたら</p>
                        <p className="text-xs text-slate-300 leading-relaxed font-bold">
                            GASの「デプロイを管理」からURLを再取得し、上のスナップショットの <code>WEB_APP_URL</code> を書き換えてください。「全員(Anyone)」への公開権限設定を再確認してください。
                        </p>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/20">
                        <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-3">2. AIの応答が不自然になったら</p>
                        <p className="text-xs text-slate-300 leading-relaxed font-bold">
                            APIキーの環境変数が <code>process.env.API_KEY</code> に正しく注入されているか確認してください。
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-emerald-50 border-[6px] border-emerald-100 p-8 rounded-[2.5rem] shadow-xl">
                <h4 className="text-2xl font-black text-emerald-800 mb-4 flex items-center gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                    現行プラン対応ステータス
                </h4>
                <div className="p-5 bg-white rounded-2xl border-2 border-emerald-200 shadow-sm font-bold text-emerald-900 text-sm leading-relaxed">
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-500">✔</span>
                            <span>ドコモ MAX, ポイ活 MAX, ポイ活 20, mini, ahamo（5プラン対応）</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-500">✔</span>
                            <span>ahamoのオンライン限定ガイダンス対応済み</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DeploymentGuide;
