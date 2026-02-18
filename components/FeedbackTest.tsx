import React, { useState } from 'react';
import { LoadingIcon, CheckCircleIcon, WifiOffIcon, SparklesIcon } from './Icons.tsx';
import { generateAiContentAsync } from '../api.ts';
import { Persona } from '../types.ts';

interface FeedbackTestProps {
  adminToken: string | null;
  apiKey: string | null;
}

const FeedbackTest: React.FC<FeedbackTestProps> = ({ adminToken, apiKey }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setStatus('loading');
    setResult(null);
    setError(null);

    if (!adminToken) {
        setStatus('error');
        setError("管理者トークンが見つかりません。再ログインしてください。");
        return;
    }

    // Sample data for the test
    const sampleTranscript = `顧客: もしもし、スマホのことで聞きたいことがあるんですけど。なんか最近動作が遅くて困ってるんですが、これってプランが古いのと関係ありますか？
コミュニケーター: お電話ありがとうございます。担当の高橋です。スマートフォンの動作が遅いとのこと、ご不便をおかけしております。詳しくお話を伺ってもよろしいでしょうか？
顧客: はい。アプリを開くのに時間がかかったり、文字入力がもたついたりするんです。
コミュニケーター: かしこまりました。お客様の契約状況を確認いたしますので、ご契約の電話番号とお名前を教えていただけますでしょうか。`;
    const samplePersona: Persona = { ageGroup: '壮年', personality: '性急', knowledgeLevel: '一般的' };

    try {
      // Fixed: Removed extra arguments
      const { data: analysisString } = await generateAiContentAsync({
          schemaName: 'analyzeRolePlay',
          data: { 
              scenarioName: '【テスト用】動作遅延の相談',
              initialInquiry: 'スマホの動作が遅い',
              persona: samplePersona,
              transcriptText: sampleTranscript,
              ngWords: ['もしもし', 'でも', 'だって']
          }
      });
      
      const analysis = JSON.parse(analysisString);
      setResult(analysis);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || '不明なエラーが発生しました。');
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-slate-50 space-y-4">
      <h3 className="font-semibold text-lg">フィードバック生成シミュレーション</h3>
      <p className="text-sm text-slate-500">
        AIによるロールプレイングのフィードバック生成機能が正常に動作するかをテストします。ボタンを押すと、サンプルデータを使用してサーバーに分析を依頼します。
      </p>

      <button
        onClick={runTest}
        disabled={status === 'loading'}
        className="w-full bg-rose-600 text-white font-bold py-2 px-4 rounded-md hover:bg-rose-700 transition flex items-center justify-center disabled:bg-slate-400"
      >
        {status === 'loading' ? (
          <>
            <LoadingIcon className="h-5 w-5 mr-2" />
            <span>テストを実行中... (最大5分)</span>
          </>
        ) : (
          <>
            <SparklesIcon className="h-5 w-5 mr-2" />
            <span>フィードバック生成テストを実行</span>
          </>
        )}
      </button>

      {status === 'success' && result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="flex items-center text-green-700 font-bold mb-2">
            <CheckCircleIcon className="h-6 w-6 mr-2" />
            <span>テスト成功！</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">AIからのフィードバックを正常に受信しました。</p>
          <div className="bg-white p-4 rounded border text-sm space-y-2">
              <div><strong>総合得点:</strong> {result.totalScore}</div>
              <div><strong>評価概要:</strong></div>
              <div className="mt-1 whitespace-pre-wrap text-slate-700">{result.summary}</div>
          </div>
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-slate-500">受信した全データを表示</summary>
            <pre className="bg-white p-2 mt-2 rounded max-h-40 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {status === 'error' && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
             <div className="flex items-center text-red-700 font-bold mb-2">
                <WifiOffIcon className="h-6 w-6 mr-2" />
                <span>フィードバックテスト失敗！</span>
             </div>
             <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackTest;