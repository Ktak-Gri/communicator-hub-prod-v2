
import React, { useState, useEffect } from 'react';
import { CloseIcon, TrashIcon, PlusIcon, LoadingIcon } from './Icons.tsx';

interface FaqTopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  faqTopics: string[];
  onSaveTopics: (topics: string[]) => Promise<boolean>;
  isSaving: boolean;
}

const FaqTopicsModal: React.FC<FaqTopicsModalProps> = ({ isOpen, onClose, faqTopics, onSaveTopics, isSaving }) => {
  const [internalTopics, setInternalTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => { if (isOpen) setInternalTopics(faqTopics); }, [isOpen, faqTopics]);

  const handleSave = async () => { if (await onSaveTopics(internalTopics)) onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[120] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">テストトピック設定</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input type="text" value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="トピック名" className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-sky-500 outline-none" />
            <button onClick={() => { if (newTopic) { setInternalTopics([...internalTopics, newTopic]); setNewTopic(''); } }} className="bg-sky-600 text-white p-2 rounded-md hover:bg-sky-700 transition-colors"><PlusIcon /></button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
            {internalTopics.map(t => (
              <div key={t} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                <span className="text-sm font-bold text-slate-700">{t}</span>
                <button onClick={() => setInternalTopics(prev => prev.filter(x => x !== t))} className="text-sky-500 hover:text-sky-700 p-1">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <button onClick={handleSave} className="bg-sky-600 text-white font-black py-2 px-8 rounded-xl shadow-md hover:bg-sky-700 disabled:bg-slate-400 transition-all" disabled={isSaving}>
            {isSaving ? <LoadingIcon /> : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default FaqTopicsModal;
