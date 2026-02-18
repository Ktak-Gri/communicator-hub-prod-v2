
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
    setStatus('loading'); setResult(null); setError(null);
    try {
      const { data: analysisString } = await generateAiContentAsync({
          schemaName: 'analyzeRolePlay',
          prompt: "Test transcription for feedback diagnostics."
      });
      setResult(JSON.parse(analysisString));
      setStatus('success');
    } catch (err: any) {
      setStatus('error'); setError(err.message);
    }
  };

  return (
    <div className="p-6 border rounded-2xl bg-slate-50 space-y-4">
      <h3 className="font-bold">AI解析診断</h3>
      <button onClick={runTest} className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold">テスト実行</button>
      {status === 'success' && <div className="text-emerald-600 font-bold text-sm">解析成功</div>}
    </div>
  );
};
export default FeedbackTest;
