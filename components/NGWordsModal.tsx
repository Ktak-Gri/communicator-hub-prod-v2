
import React, { useState, useEffect } from 'react';
import { CloseIcon, TrashIcon, PlusIcon, LoadingIcon } from './Icons';

interface NGWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ngWords: string[];
  setNgWords: (words: string[]) => Promise<boolean>;
  isSaving: boolean;
}

const NGWordsModal: React.FC<NGWordsModalProps> = ({ isOpen, onClose, ngWords, setNgWords, isSaving }) => {
  const [internalWords, setInternalWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInternalWords(ngWords);
    }
  }, [isOpen, ngWords]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddWord = () => {
    if (newWord && !internalWords.includes(newWord)) {
      setInternalWords([...internalWords, newWord]);
      setNewWord('');
    }
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setInternalWords(internalWords.filter(word => word !== wordToRemove));
  };

  const handleSave = async () => {
    const success = await setNgWords(internalWords);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="ngwords-modal-title" className="bg-white rounded-lg shadow-xl w-full max-w-md my-20 mx-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 id="ngwords-modal-title" className="text-lg font-semibold">NGワード設定</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6">
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="新しいNGワードを入力"
              className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
            />
            <button
              type="button"
              onClick={handleAddWord}
              className="bg-indigo-500 text-white px-4 rounded-md hover:bg-indigo-600 flex items-center justify-center"
            >
              <PlusIcon />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {internalWords.map((word) => (
              <div key={word} className="flex justify-between items-center bg-slate-100 p-2 rounded">
                <span>{word}</span>
                <button onClick={() => handleRemoveWord(word)} className="text-red-500 hover:text-red-700">
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 w-24 h-10 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 flex justify-center items-center disabled:bg-slate-400 disabled:cursor-wait"
            disabled={isSaving}
          >
            {isSaving ? <LoadingIcon className="h-5 w-5"/> : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NGWordsModal;
