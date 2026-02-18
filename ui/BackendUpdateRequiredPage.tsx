
import React from 'react';
import { WifiOffIcon, InformationCircleIcon, Cog6ToothIcon } from './Icons.tsx';

interface Props {
  backendVersion: string | null;
  expectedVersion: string;
  onIgnoreMismatch?: () => void;
}

const BackendUpdateRequiredPage: React.FC<Props> = ({ backendVersion, expectedVersion, onIgnoreMismatch }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full border-t-8 border-rose-500">
        <div className="text-center mb-8">
            <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOffIcon className="h-10 w-10 text-rose-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-widest">バックエンド更新が必要</h2>
            <p className="text-slate-500 text-sm mt-2">期待バージョン: {expectedVersion} / 現在: {backendVersion || '不明'}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-amber-900 flex items-center gap-2"><Cog6ToothIcon className="h-5 w-5" /> 解決方法</h3>
            <p className="text-sm text-amber-800">constants.ts 内の WEB_APP_URL を最新のデプロイURLに書き換えてください。</p>
        </div>
        <div className="mt-8 flex flex-col gap-4">
            <button onClick={() => window.location.reload()} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg">リロード</button>
            {onIgnoreMismatch && <button onClick={onIgnoreMismatch} className="text-sm text-slate-400 font-bold underline">バージョンチェックを無視して起動</button>}
        </div>
      </div>
    </div>
  );
};
export default BackendUpdateRequiredPage;
