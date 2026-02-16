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
    <div className="bg-[#f8fafc] min-h-[90vh] flex flex-col items-center justify-center p-2 text-slate-900 animate-fade-in">
      <div className="mb-2">
        <span className="bg-[#1e293b] text-[#0ea5e9] text-[9px] font-black px-3 py-0.5 rounded-lg shadow-sm uppercase tracking-widest">
          SYSTEM: {APP_VERSION}
        </span>
      </div>

      <div className="w-full max-w-[340px]">
        <div className="bg-white px-7 py-7 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center space-y-5">
          <h1 className="text-[26px] font-black text-[#1e293b] tracking-tighter leading-none">
            コミュニケータ育成<span className="text-[#0071bc]">HUB</span>
          </h1>

          <div className="text-center space-y-0.5">
            <p className="text-[#64748b] font-black text-[15px] tracking-tight leading-none">
              研修生の氏名を入力
            </p>
            <p className="text-[#cbd5e1] font-bold text-[10px] tracking-tight leading-none">
              (※姓名の間にスペースを空けない)
            </p>
          </div>

          <div className="w-full space-y-3">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className={`w-full py-3 px-5 bg-slate-50 border-2 ${error ? 'border-rose-300' : 'border-slate-100'} rounded-xl text-slate-700 text-base focus:outline-none focus:border-sky-400 focus:bg-white transition-all font-bold text-center shadow-inner placeholder:text-[#cbd5e1]`}
                placeholder="氏名を入力"
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && onLogin()}
              />
              {error && (
                <div className="mt-1.5 text-center animate-fade-in">
                  <p className="text-rose-500 text-[10px] font-bold leading-none">{error}</p>
                </div>
              )}
            </div>

            <button
              onClick={onLogin}
              className={`w-full py-3 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-md font-black text-base ${
                isLoading 
                ? 'bg-sky-100 text-sky-400 cursor-not-allowed' 
                : isNameEmpty
                  ? 'bg-slate-400 text-white cursor-not-allowed shadow-none'
                  : 'bg-[#005c99] text-white hover:bg-[#004a7a] shadow-blue-900/20'
              }`}
              disabled={isNameEmpty || isLoading}
            >
              {isLoading ? (
                <LoadingIcon className="h-5 w-5" />
              ) : (
                <div className={`p-0.5 rounded-full border-2 transition-colors ${isNameEmpty ? 'border-slate-300 text-slate-300' : 'border-white/40 text-white'}`}>
                  <PlayIcon className="h-3 w-3 fill-current" />
                </div>
              )}
              <span className="tracking-widest">研修をはじめる</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-50 w-full text-center">
            <button 
              onClick={onAdminLoginClick}
              className="text-[#cbd5e1] font-bold text-[11px] hover:text-sky-400 transition-colors tracking-tight uppercase"
            >
              管理者ログイン
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;