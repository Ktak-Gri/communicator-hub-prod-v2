import React from 'react';
import { LoadingIcon, PlayIcon, Button } from './ui-shared.tsx';
import { APP_VERSION } from './constants.ts';

/**
 * Gold Build デザインのローディング画面
 */
export const LoadingView = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 z-[9999] animate-fade-in">
    <div className="relative mb-6">
      <div className="spinner w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
    </div>
    <div className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse">Initializing System</div>
  </div>
);

/**
 * Gold Build デザインのログイン画面
 */
export const LoginView = ({ traineeName, setTraineeName, onLogin, onAdminClick, isLoading, error }: any) => (
  <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 animate-fade-in">
    <div className="mb-2">
      <span className="bg-slate-800 text-sky-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-700 uppercase tracking-widest shadow-sm">
        APP: {APP_VERSION}
      </span>
    </div>
    <div className="w-full max-w-[340px]">
      <div className="bg-white px-8 py-8 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-6 text-center">
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">
          コミュニケーター育成<span className="text-sky-600">HUB</span>
        </h1>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-slate-600 font-black text-sm">研修生の氏名を入力</p>
            <p className="text-slate-400 font-bold text-[10px]">(姓名の間にスペースを空けない)</p>
          </div>
          <input 
            type="text" 
            value={traineeName} 
            onChange={e => setTraineeName(e.target.value)} 
            placeholder="氏名を入力" 
            className={`w-full py-4 px-5 bg-slate-50 border-2 ${error ? 'border-rose-400' : 'border-slate-100'} rounded-2xl text-center font-black outline-none focus:border-sky-500 focus:bg-white transition-all`} 
            onKeyPress={e => e.key === 'Enter' && onLogin(traineeName)}
            disabled={isLoading}
          />
          {error && <p className="text-rose-500 text-xs font-bold animate-shake">{error}</p>}
          <Button 
            onClick={() => onLogin(traineeName)} 
            disabled={isLoading || !traineeName.trim()} 
            className="w-full py-4 flex justify-center gap-2"
          >
            {isLoading ? <LoadingIcon /> : <PlayIcon />} <span className="tracking-widest">研修を開始する</span>
          </Button>
        </div>
        <div className="pt-2 border-t border-slate-50">
          <button onClick={onAdminClick} className="text-slate-300 font-bold text-[11px] uppercase hover:text-sky-500 tracking-widest">管理者ログイン</button>
        </div>
      </div>
      <p className="mt-4 text-center text-slate-400 font-black text-[10px] uppercase opacity-40">© UT Group Co., Ltd.</p>
    </div>
  </div>
);

export const PreflightView = ({ onRetry, error }: any) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 text-center space-y-4">
    <div className="text-rose-500 text-6xl">⚠️</div>
    <h2 className="text-2xl font-black italic uppercase">Connection Error</h2>
    <p className="text-slate-500 font-bold max-w-sm">バックエンドに接続できません。設定を確認してください。</p>
    <div className="bg-slate-900 p-4 rounded-xl font-mono text-[10px] text-emerald-400 break-all w-full max-w-md">{error}</div>
    <Button onClick={onRetry}>再試行</Button>
  </div>
);