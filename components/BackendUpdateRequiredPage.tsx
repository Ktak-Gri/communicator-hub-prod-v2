
import React from 'react';
import { SPREADSHEET_ID, WEB_APP_URL } from '../constants.ts';
import { WifiOffIcon, ArrowTopRightOnSquareIcon, ClipboardIcon, InformationCircleIcon, CheckCircleIcon, SparklesIcon, Cog6ToothIcon } from './Icons.tsx';

interface Props {
  backendVersion: string | null;
  expectedVersion: string;
  onIgnoreMismatch?: () => void;
}

const BackendUpdateRequiredPage: React.FC<Props> = ({ backendVersion, expectedVersion, onIgnoreMismatch }) => {
  const copyUrl = () => {
    navigator.clipboard.writeText(WEB_APP_URL)
        .then(() => alert('URLをコピーしました。constants.tsの内容と、GASのデプロイURLを比較してください。'))
        .catch(() => alert('コピーに失敗しました。'));
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const handleEmergencyBypass = () => {
    if (window.confirm("警告：バージョンが古いままアプリを起動すると、データの保存や削除が正常に行われない可能性があります。よろしいですか？")) {
        localStorage.setItem('bypassVersionCheck', 'true');
        if (onIgnoreMismatch) onIgnoreMismatch();
    }
  };

  const diagnosticUrl = `${WEB_APP_URL}${WEB_APP_URL.includes('?') ? '&' : '?'}_t=${Date.now()}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-3xl w-full border-t-8 border-rose-500">
        <div className="text-center mb-6">
            <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOffIcon className="h-10 w-10 text-rose-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight tracking-widest">バックエンド不一致を検出</h2>
            <p className="text-slate-500 text-sm mt-2">
                このアプリは <b>"{expectedVersion}"</b> を期待していますが、<br/>
                接続先のGASからは <b>"{backendVersion || '不明'}"</b> が返されています。
            </p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
              <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <Cog6ToothIcon className="h-5 w-5" />
                  考えられる原因：URLが違います
              </h3>
              <div className="text-sm text-amber-800 space-y-3 leading-relaxed">
                  <p>GAS側で「新しくデプロイ」を実行すると、<b>URLの末尾（ID）が変わってしまいます。</b></p>
                  <p>
                    1. GASエディタの <b>[デプロイを管理]</b> を開き、そこに表示されている最新の「ウェブアプリURL」をコピーしてください。<br/>
                    2. このアプリの <code>constants.ts</code> にある <code>WEB_APP_URL</code> を、その新しいURLに書き換えて保存してください。
                  </p>
              </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <InformationCircleIcon className="h-5 w-5 text-indigo-600" />
                  現在の設定状況
              </h3>
              <div className="space-y-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">constants.ts に設定中のURL:</p>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <code className="flex-1 bg-slate-100 p-2 rounded text-[10px] font-mono text-slate-600 truncate">{WEB_APP_URL}</code>
                        <button onClick={copyUrl} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition flex-shrink-0" title="URLをコピー">
                            <ClipboardIcon className="h-4 w-4" />
                        </button>
                      </div>
                  </div>
                  <button 
                    onClick={() => openInNewTab(diagnosticUrl)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                  >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                      このURLが今返しているJSONをブラウザで見る
                  </button>
              </div>
          </div>

          <div className="pt-6 flex flex-col items-center gap-4">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 transition shadow-lg flex items-center justify-center gap-2"
              >
                  リロード（修正後に実行）
              </button>
              
              <button 
                onClick={handleEmergencyBypass} 
                className="text-sm text-slate-400 hover:text-rose-500 font-bold underline transition py-2"
              >
                  不一致を無視してアプリを強引に起動する
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendUpdateRequiredPage;
