import React, { useState } from 'react';
import { LoadingIcon, CheckCircleIcon, WifiOffIcon } from './Icons.tsx';
import { ExportedSettings } from '../types.ts';
import { requestWithJsonp } from '../api.ts';
import { buildErrorMessage } from './PreflightCheckPage.tsx';

interface SpreadsheetTestProps {
  webAppUrl: string;
}

const SpreadsheetTest: React.FC<SpreadsheetTestProps> = ({ webAppUrl }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<ExportedSettings | null>(null);
  const [errorNode, setErrorNode] = useState<React.ReactNode | null>(null);

  const runTest = async () => {
    setStatus('loading');
    setData(null);
    setErrorNode(null);

    try {
      const { data: jsonData } = await requestWithJsonp('getSettings');
      setData(jsonData);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorNode(buildErrorMessage(err, webAppUrl));
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-slate-50 space-y-4">
      <h3 className="font-semibold text-lg">システム接続診断</h3>
      <p className="text-sm text-slate-500">
        Googleスプレッドシートとの通信が正常に行えるか診断します。ボタンを押すと、現在の設定でデータ取得を試みます。
      </p>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-600">診断対象のデプロイURL</label>
        <p className="text-xs bg-slate-200 p-2 rounded break-all">
          <code>{webAppUrl || 'URLが設定されていません'}</code>
        </p>
      </div>

      <button
        onClick={runTest}
        disabled={status === 'loading'}
        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center justify-center disabled:bg-slate-400"
      >
        {status === 'loading' ? (
          <>
            <LoadingIcon className="h-5 w-5 mr-2" />
            <span>診断を実行中...</span>
          </>
        ) : (
          <span>診断を実行</span>
        )}
      </button>

      {status === 'success' && data && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="flex items-center text-green-700 font-bold mb-2">
            <CheckCircleIcon className="h-6 w-6 mr-2" />
            <span>接続に成功しました！</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">スプレッドシートから以下のデータ概要を取得できました。</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-2 rounded border"><strong>シナリオ:</strong> {data.scenarios?.length || 0} 件</div>
              <div className="bg-white p-2 rounded border"><strong>NGワード:</strong> {data.ngWords?.length || 0} 件</div>
              <div className="bg-white p-2 rounded border"><strong>テストトピック:</strong> {data.faqTopics?.length || 0} 件</div>
              <div className="bg-white p-2 rounded border"><strong>センター設定:</strong> {data.masterSettings?.length || 0} 件</div>
          </div>
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-slate-500">受信した全データを表示</summary>
            <pre className="bg-white p-2 mt-2 rounded max-h-40 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {status === 'error' && errorNode && (
        <div className="p-4 bg-white border border-red-200 rounded-lg animate-fade-in text-center">
             <WifiOffIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
            {errorNode}
        </div>
      )}
    </div>
  );
};

export default SpreadsheetTest;