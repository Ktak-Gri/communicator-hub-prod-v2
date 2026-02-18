import React from 'react';
import { TestHistoryItem } from '../types.ts';
import { CloseIcon, CheckCircleIcon } from './Icons.tsx';

interface TestResultModalProps {
  result: TestHistoryItem;
  onClose: () => void;
}

const AiBadge: React.FC = () => (
  <span className="ml-2 px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-200 rounded-full align-middle">
    AI自動生成
  </span>
);

const renderStars = (level: any, max: number = 5) => {
  let val = 0;
  const s = String(level ?? '').trim();
  const normalized = s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  const match = normalized.match(/(\d+)/);
  if (match) {
      val = parseInt(match[1], 10);
  } else {
      const starCount = (s.match(/[★⭐️]/g) || []).length;
      if (starCount > 0) val = starCount;
  }
  const safeLevel = Math.max(0, Math.min(val, max));
  return (
    <div className="flex text-amber-400 select-none">
      {[...Array(max)].map((_, i) => (
        <span key={i} className="text-lg">
          {i < safeLevel ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
};

const TestResultModal: React.FC<TestResultModalProps> = ({ result, onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isAiGenerated = result.questionId && String(result.questionId).startsWith('gen-');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[110] overflow-y-auto p-4 sm:p-8 animate-fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-3xl my-24 mx-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-3xl">
            <div>
                <div className="flex items-center">
                    <h2 className="text-2xl font-black text-slate-800">テスト結果詳細</h2>
                    {isAiGenerated && <AiBadge />}
                </div>
                <div className="flex mt-1">
                    {renderStars(result.difficulty)}
                </div>
            </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><CloseIcon /></button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">問題内容</h3>
            <p className="p-4 bg-white rounded-xl text-slate-800 font-bold border border-slate-200">{result.questionText}</p>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">あなたの回答</h3>
            <p className="p-4 bg-sky-50 border border-sky-100 rounded-xl text-slate-800 font-bold whitespace-pre-wrap">{result.userAnswer}</p>
          </div>
          <div className="p-6 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-black text-emerald-800 mb-2 flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  AIフィードバック
                </h3>
                <p className="text-emerald-900 text-sm font-bold leading-relaxed whitespace-pre-wrap">{result.aiFeedback}</p>
              </div>
              <div className="text-center ml-6 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Score</p>
                <p className="text-4xl font-black text-sky-600">{result.score}</p>
              </div>
            </div>
          </div>
          <details className="bg-white rounded-xl border border-slate-200 group">
            <summary className="p-4 font-black text-slate-700 cursor-pointer flex justify-between items-center list-none hover:bg-slate-50 transition-colors">
              <span>模範解答を表示</span>
              <svg className="w-5 h-5 transform transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="p-4 border-t text-slate-600 text-sm font-bold whitespace-pre-wrap leading-relaxed">
              {result.modelAnswer}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default TestResultModal;