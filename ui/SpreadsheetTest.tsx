
import React, { useState } from 'react';
import { LoadingIcon, CheckCircleIcon, WifiOffIcon } from './Icons.tsx';
import { ExportedSettings } from '../types.ts';
import { apiClient } from '../apiClient.ts';

interface SpreadsheetTestProps {
  webAppUrl: string;
}

const SpreadsheetTest: React.FC<SpreadsheetTestProps> = ({ webAppUrl }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<ExportedSettings | null>(null);

  const runTest = async () => {
    setStatus('loading');
    try {
      const response = await apiClient.getSettings();
      setData(response.data);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
    }
  };

  return (
    <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-slate-50 space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-800">接続テスト</h3>
        <p className="text-xs font-bold text-slate-500">スプレッドシートへの疎通確認</p>
      </div>
      
      <button onClick={runTest} disabled={status === 'loading'} className="w-full bg-white border-2 border-slate-200 text-slate-800 font-black py-4 rounded-2xl hover:border-sky-500 hover:text-sky-600 transition flex items-center justify-center gap-3 shadow-sm disabled:opacity-50">
        {status === 'loading' ? <LoadingIcon className="text-sky-500" /> : <WifiOffIcon className="h-5 w-5" />}
        <span>接続テスト実行</span>
      </button>

      {status === 'success' && (
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fade-in">
          <div className="flex items-center text-emerald-700 font-black gap-2 mb-2">
            <CheckCircleIcon className="h-5 w-5" />
            <span>接続成功</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold leading-relaxed">バックエンドへのリクエストおよび、スプレッドシートからのデータ取得に成功しました。</p>
        </div>
      )}
    </div>
  );
};
export default SpreadsheetTest;
