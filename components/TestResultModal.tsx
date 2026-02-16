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

// Helper to render stars UI (e.g. ★★★☆☆)
// Enhanced to handle string numbers, full-width numbers, star characters, and nulls robustly.
const renderStars = (level: any, max: number = 5) => {
  let val = 0;
  const s = String(level ?? '').trim(); // Handle null/undefined via string conversion immediately

  // 1. Normalize full-width numbers to half-width
  const normalized = s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  
  // 2. Try to find a number first
  const match = normalized.match(/(\d+)/);
  if (match) {
      val = parseInt(match[1], 10);
  } else {
      // 3. If no number, count existing stars
      const starCount = (s.match(/[★⭐️]/g) || []).length;
      if (starCount > 0) {
          val = starCount;
      }
  }
  
  const safeLevel = Math.max(0, Math.min(val, max));
  return (
    <div className="flex text-amber-400 select-none" title={`難易度: ${safeLevel} / 5 (元データ: ${s})`}>
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
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const isAiGenerated = result.questionId && String(result.questionId).startsWith('gen-');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 overflow-y-auto p-4 sm:p-8 animate-fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="test-result-modal-title" className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-3xl my-24 mx-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
            <div>
                <div className="flex items-center">
                    <h2 id="test-result-modal-title" className="text-2xl font-bold text-slate-700">テスト結果詳細</h2>
                    {isAiGenerated && <AiBadge />}
                </div>
                <div className="flex text-amber-400 mt-1">
                    {renderStars(result.difficulty)}
                </div>
            </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">問題</h3>
            <p className="p-4 bg-slate-100 rounded-lg text-slate-800">{result.questionText}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">あなたの回答</h3>
            <p className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-slate-800 whitespace-pre-wrap">{result.userAnswer}</p>
          </div>
          <div className="p-6 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-emerald-800 mb-3 flex items-center">
                  <CheckCircleIcon className="h-6 w-6 mr-2" />
                  <span>AIからのフィードバック</span>
                </h3>
                <p className="text-emerald-900 whitespace-pre-wrap">{result.aiFeedback}</p>
              </div>
              <div className="text-center ml-4 flex-shrink-0">
                <p className="text-sm font-semibold text-slate-600">評点</p>
                <p className="text-5xl font-bold text-sky-600">{result.score}</p>
              </div>
            </div>
          </div>
          <div>
            <details className="bg-white rounded-lg shadow-sm group border">
              <summary className="p-4 font-semibold text-slate-700 cursor-pointer flex justify-between items-center list-none group-hover:bg-slate-50 rounded-t-lg">
                <span>模範解答を表示</span>
                <svg className="w-5 h-5 transform transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 border-t text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-b-lg">
                {result.modelAnswer}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultModal;