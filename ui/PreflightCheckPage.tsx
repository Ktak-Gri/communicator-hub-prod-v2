
import React, { useState } from 'react';
import { WifiOffIcon, ClipboardIcon, CheckCircleIcon, InformationCircleIcon, LoadingIcon, ArrowPathIcon, HomeIcon } from './Icons.tsx';
import { getEffectiveUrl, setSessionUrlOverride } from '../api.ts';

interface PreflightCheckPageProps {
  error: { reactNode: React.ReactNode; rawMessage: string };
  onRetry: () => void;
  onForceReset?: () => void;
  onBypass?: () => void;
}

const PreflightCheckPage: React.FC<PreflightCheckPageProps> = ({ error, onRetry, onForceReset, onBypass }) => {
    const [overrideUrl, setOverrideUrl] = useState(getEffectiveUrl());
    const [isApplying, setIsApplying] = useState(false);

    const handleFullReset = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    const validateAndApply = () => {
        setIsApplying(true);
        setSessionUrlOverride(overrideUrl);
        setTimeout(() => {
            setIsApplying(false);
            onRetry();
        }, 800);
    };

    return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full border-t-[10px] border-rose-600 animate-fade-in text-left">
        <div className="text-center mb-8">
            <div className="mx-auto bg-rose-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <WifiOffIcon className="h-10 w-10 text-rose-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter">通信接続エラー</h2>
            <p className="text-slate-400 font-bold text-xs uppercase mt-1">バックエンドに接続できません</p>
        </div>

        <div className="space-y-6">
            <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                <h3 className="font-black text-amber-800 flex items-center gap-2 mb-4 text-sm uppercase">
                    <InformationCircleIcon className="h-5 w-5" />
                    解決のためのヒント
                </h3>
                <p className="text-xs text-amber-700 font-bold leading-relaxed mb-4">GASのデプロイURLが変更されている可能性があります。最新のURLを入力して適用してください。</p>
                
                <div className="space-y-2">
                    <input 
                        type="text" 
                        value={overrideUrl}
                        onChange={(e) => setOverrideUrl(e.target.value)}
                        className="w-full p-4 text-[11px] font-mono border-2 border-amber-200 rounded-xl outline-none bg-white"
                        placeholder="https://script.google.com/macros/s/..."
                    />
                    <button onClick={validateAndApply} disabled={isApplying} className="w-full bg-sky-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2">
                        {isApplying ? <LoadingIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                        <span>新しいURLを適用して再接続</span>
                    </button>
                </div>
            </div>

            <div className="p-5 bg-slate-900 rounded-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">エラー詳細</p>
                <div className="text-[11px] font-mono text-emerald-400 break-all max-h-32 overflow-y-auto custom-scrollbar">
                    {error.rawMessage}
                </div>
            </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
            <button onClick={onRetry} className="bg-sky-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-md">
                <ArrowPathIcon className="h-5 w-5" /> 再試行
            </button>
            {onBypass && (
                <button onClick={onBypass} className="bg-slate-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-md">
                    <HomeIcon className="h-5 w-5" /> 強制起動
                </button>
            )}
        </div>
        <div className="mt-4 text-center">
            <button onClick={handleFullReset} className="text-rose-500 font-bold text-[10px] uppercase hover:underline">設定を完全にリセット</button>
        </div>
      </div>
    </div>
  );
};

export default PreflightCheckPage;
