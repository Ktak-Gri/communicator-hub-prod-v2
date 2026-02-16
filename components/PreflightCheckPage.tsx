
import React, { useState } from 'react';
import { WifiOffIcon, ClipboardIcon, LogoutIcon, CheckCircleIcon, InformationCircleIcon, LoadingIcon, ArrowPathIcon, HomeIcon } from './Icons.tsx';
import { getEffectiveUrl, setSessionUrlOverride } from '../api.ts';

interface PreflightCheckPageProps {
  error: { reactNode: React.ReactNode; rawMessage: string };
  onRetry: () => void;
  onForceReset?: () => void;
  onBypass?: () => void;
}

export const buildErrorMessage = (err: any, url: string) => {
    return (
        <div className="space-y-2">
            <p className="text-sm font-bold text-rose-600">通信エラーが発生しました</p>
            <p className="text-xs text-slate-600 leading-relaxed">{err?.message || String(err)}</p>
            <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-50 p-2 rounded break-all">
                Target: {url}
            </div>
        </div>
    );
};

const PreflightCheckPage: React.FC<PreflightCheckPageProps> = ({ error, onRetry, onForceReset, onBypass }) => {
    const [overrideUrl, setOverrideUrl] = useState(getEffectiveUrl());
    const [isApplying, setIsApplying] = useState(false);
    const [urlValidationError, setUrlValidationError] = useState<string | null>(null);

    const handleFullReset = () => {
        try {
            sessionStorage.clear();
            localStorage.clear();
            if (onForceReset) onForceReset();
        } catch (e) {
            console.error("Storage clear error", e);
        }
        window.location.reload();
    };

    const validateAndApply = () => {
        setUrlValidationError(null);
        let url = overrideUrl.trim();
        if (!url.startsWith('https://script.google.com/')) {
            setUrlValidationError("Google Apps ScriptのURLを入力してください。");
            return;
        }
        setIsApplying(true);
        setSessionUrlOverride(url);
        setTimeout(() => {
            setIsApplying(false);
            onRetry();
        }, 800);
    };

    const copyToClipboard = () => {
        const text = `[Diagnostic]\nError: ${error.rawMessage}\nURL: ${getEffectiveUrl()}\nTime: ${new Date().toLocaleString()}`;
        navigator.clipboard.writeText(text).then(() => alert('診断情報をコピーしました。'));
    };

    return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full border-t-[10px] border-rose-600 animate-fade-in text-left">
        <div className="text-center mb-8">
            <div className="mx-auto bg-rose-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <WifiOffIcon className="h-10 w-10 text-rose-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">Connection Error</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">GASバックエンドに接続できません</p>
        </div>

        <div className="space-y-6">
            <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                <h3 className="font-black text-amber-800 flex items-center gap-2 mb-4 text-sm uppercase">
                    <InformationCircleIcon className="h-5 w-5" />
                    解決のためのチェックリスト
                </h3>
                <ol className="text-xs text-amber-700 space-y-3 font-bold list-decimal list-inside leading-relaxed">
                    <li>GASエディタの[デプロイを管理]から最新のURLを再取得してください。</li>
                    <li>アクセス設定が <b>「全員(Anyone)」</b> になっているか確認してください。</li>
                    <li>下の入力欄に最新のURLを貼り付け、適用ボタンを押してください。</li>
                </ol>
                
                <div className="mt-5 space-y-2">
                    <input 
                        type="text" 
                        value={overrideUrl}
                        onChange={(e) => setOverrideUrl(e.target.value)}
                        className={`w-full p-4 text-[11px] font-mono border-2 rounded-xl outline-none transition-all bg-white shadow-inner ${urlValidationError ? 'border-rose-400' : 'border-amber-200 focus:border-amber-500'}`}
                        placeholder="https://script.google.com/macros/s/.../exec"
                    />
                    <button 
                        onClick={validateAndApply}
                        disabled={isApplying}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
                    >
                        {isApplying ? <LoadingIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                        <span>新しいURLを適用して通信を復旧</span>
                    </button>
                </div>
            </div>

            <div className="p-5 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Detailed Error Data</p>
                <div className="text-[11px] font-mono text-emerald-400 break-all bg-black/40 p-4 rounded-lg border border-white/5 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                    {error.rawMessage}
                </div>
            </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                    onClick={onRetry} 
                    className="bg-indigo-600 text-white font-black py-5 px-6 rounded-2xl hover:bg-indigo-700 transition shadow-xl flex flex-col items-center gap-1 transform active:scale-95 cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <ArrowPathIcon className="h-6 w-6" />
                        <span className="text-lg">再試行</span>
                    </div>
                    <span className="text-[9px] opacity-70 font-bold uppercase tracking-widest">Retry connection</span>
                </button>
                {onBypass && (
                    <button 
                        onClick={onBypass} 
                        className="bg-slate-800 text-white font-black py-5 px-6 rounded-2xl hover:bg-black transition shadow-xl flex flex-col items-center gap-1 transform active:scale-95 cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <HomeIcon className="h-6 w-6" />
                            <span className="text-lg">エラーを無視して起動</span>
                        </div>
                        <span className="text-[9px] opacity-70 font-bold uppercase tracking-widest">Bypass error (AIS Mode)</span>
                    </button>
                )}
            </div>
            
            <div className="flex justify-between items-center gap-2">
                <button onClick={handleFullReset} className="text-rose-500 font-bold text-[10px] uppercase hover:underline">
                    設定を完全リセット
                </button>
                <button onClick={copyToClipboard} className="text-slate-400 font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest">
                    <ClipboardIcon className="h-3 w-3" />
                    <span>情報をコピー</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PreflightCheckPage;
