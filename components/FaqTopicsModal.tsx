
import React, { useState, useEffect } from 'react';
import { CloseIcon, TrashIcon, PlusIcon, LoadingIcon } from './Icons';

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

  useEffect(() => {
    if (isOpen) {
      setInternalTopics(faqTopics);
    }
  }, [isOpen, faqTopics]);

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

  const handleAddTopic = () => {
    if (newTopic && !internalTopics.includes(newTopic)) {
      setInternalTopics([...internalTopics, newTopic]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setInternalTopics(internalTopics.filter(topic => topic !== topicToRemove));
  };

  const handleSave = async () => {
    const success = await onSaveTopics(internalTopics);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="faq-topics-modal-title" className="bg-white rounded-lg shadow-xl w-full max-w-md my-20 mx-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 id="faq-topics-modal-title" className="text-lg font-semibold">テストトピック設定</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6">
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="新しいトピックを入力"
              className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
            />
            <button
              type="button"
              onClick={handleAddTopic}
              className="bg-indigo-500 text-white px-4 rounded-md hover:bg-indigo-600 flex items-center justify-center"
            >
              <PlusIcon />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {internalTopics.map((topic) => (
              <div key={topic} className="flex justify-between items-center bg-slate-100 p-2 rounded">
                <span>{topic}</span>
                <button onClick={() => handleRemoveTopic(topic)} className="text-red-500 hover:text-red-700">
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

export default FaqTopicsModal;
