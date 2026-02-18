import React from 'react';
import { LoadingIcon, PlayIcon } from './Icons.tsx';
import { APP_VERSION } from '../constants.ts';

interface LoginScreenProps {
  name: string;
  onNameChange: (val: string) => void;
  onLogin: () => void;
  onAdminLoginClick: () => void;
  isLoading: boolean;
  error: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  name, 
  onNameChange, 
  onLogin, 
  onAdminLoginClick, 
  isLoading, 
  error 
}) => {
  const isNameEmpty = !name.trim();

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col items-center justify-center p-4 text-slate-900">
      <div className="mb-1.5">
        <span className="bg-slate-800 text-sky-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-700 uppercase tracking-[0.2em] shadow-sm">
          APP: {APP_VERSION}
        </span>
      </div>

      <div className="w-full max-w-[340px] animate-fade-in">
        <div className="bg-white px-8 pt-5 pb-5 rounded-2xl shadow-xl border border-slate-200/50 space-y-4 text-center overflow-hidden">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight">
              コミュニケーター育成<span className="text-sky-600">HUB</span>
            </h1>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-slate-600 font-black text-sm tracking-tight">
                研修生の氏名を入力
              </p>
              <p className="text-slate-400 font-bold text-[10px] leading-tight">
                (姓名の間にスペースを空けない)
              </p>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className={`w-full py-3 px-5 bg-slate-50 border-2 ${error ? 'border-rose-400' : 'border-slate-100'} rounded-xl text-slate-800 text-base focus:outline-none focus:border-sky-500 focus:bg-white transition-all font-black text-center shadow-inner placeholder:text-slate-300`}
                placeholder="氏名を入力"
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && onLogin()}
              />
              {error && (
                <div className="mt-2 animate-fade-in">
                  <p className="text-rose-500 text-xs font-bold leading-relaxed">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onLogin}
              className={`w-full py-3 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-lg font-black text-base ${
                isLoading 
                ? 'bg-sky-100 text-sky-400 cursor-not-allowed' 
                : isNameEmpty
                  ? 'bg-slate-400 text-white cursor-not-allowed shadow-none'
                  : 'bg-[#005c99] text-white hover:bg-[#004a7a] shadow-blue-900/20'
              }`}
              disabled={isNameEmpty || isLoading}
            >
              {isLoading ? <LoadingIcon className="h-5 w-5" /> : <PlayIcon className={`h-5 w-5 ${isNameEmpty ? 'text-slate-200' : 'text-white'}`} />}
              <span className="tracking-widest">研修を開始する</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <button 
              onClick={onAdminLoginClick}
              className="text-slate-400 font-black text-[11px] hover:text-sky-600 transition-colors tracking-widest uppercase"
            >
              管理者ログイン
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-center">
            <p className="text-slate-600 font-black text-[11px] tracking-tight opacity-40 uppercase tracking-[0.3em]">© UT Group Co., Ltd.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;