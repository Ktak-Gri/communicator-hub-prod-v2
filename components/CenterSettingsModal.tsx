import React, { useState, useEffect } from 'react';
import { MasterSetting } from '../types.ts';
import { CloseIcon, LoadingIcon, TrashIcon, PlusIcon } from './Icons.tsx';

interface CenterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterSettings: MasterSetting[];
  onSave: (settings: MasterSetting[]) => Promise<boolean>;
  isSaving: boolean;
}

const CenterSettingsModal: React.FC<CenterSettingsModalProps> = ({
  isOpen,
  onClose,
  masterSettings,
  onSave,
  isSaving,
}) => {
  const [internalSettings, setInternalSettings] = useState<MasterSetting[]>([]);

  useEffect(() => {
    if (isOpen) {
      setInternalSettings(JSON.parse(JSON.stringify(masterSettings)));
    }
  }, [isOpen, masterSettings]);
  
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

  const handleFieldChange = (index: number, field: keyof MasterSetting, value: any) => {
    const newSettings = [...internalSettings];
    (newSettings[index] as any)[field] = value;
    setInternalSettings(newSettings);
  };

  const handleAddNewCenter = () => {
    const newCenter: MasterSetting = {
      name: '',
      abbreviation: '',
      displayFlag: true,
      sortOrder: (Math.max(...internalSettings.map(s => s.sortOrder), 0) + 10),
      showInSummary: true,
    };
    setInternalSettings([...internalSettings, newCenter]);
  };

  const handleRemoveCenter = (index: number) => {
    if (window.confirm(`「${internalSettings[index].name || '新規センター'}」を削除しますか？`)) {
        setInternalSettings(internalSettings.filter((_, i) => i !== index));
    }
  };

  const handleSaveClick = async () => {
    for (const setting of internalSettings) {
        if (!setting.name.trim() || !setting.abbreviation.trim()) {
            alert('すべてのセンター名と略称を入力してください。');
            return;
        }
    }
    const success = await onSave(internalSettings);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto p-4 sm:p-8" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="center-settings-modal-title"
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-20 mx-auto flex flex-col max-h-[calc(100vh-10rem)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h3 id="center-settings-modal-title" className="text-lg font-semibold">センター設定</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <CloseIcon />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有効</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">センター名</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">センター略称</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ソート順</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {internalSettings.map((setting, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap">
                         <input
                            type="checkbox"
                            checked={setting.displayFlag}
                            onChange={(e) => handleFieldChange(index, 'displayFlag', e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                         />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={setting.name}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                          className="w-full p-1 border rounded-md"
                        />
                      </td>
                      <td className="px-3 py-2">
                         <input
                          type="text"
                          value={setting.abbreviation}
                          onChange={(e) => handleFieldChange(index, 'abbreviation', e.target.value)}
                          className="w-full p-1 border rounded-md"
                        />
                      </td>
                      <td className="px-3 py-2">
                         <input
                          type="number"
                          value={setting.sortOrder}
                          onChange={(e) => handleFieldChange(index, 'sortOrder', parseInt(e.target.value, 10) || 0)}
                          className="w-20 p-1 border rounded-md"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button type="button" onClick={() => handleRemoveCenter(index)} className="text-red-500 hover:text-red-700">
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAddNewCenter}
                className="w-full bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-md hover:bg-slate-200 transition flex items-center justify-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                <span>新規センターを追加</span>
              </button>
            </div>
        </div>
        
        <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
            disabled={isSaving}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="px-4 py-2 w-24 h-10 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 flex justify-center items-center disabled:bg-slate-400 disabled:cursor-wait"
            disabled={isSaving}
          >
            {isSaving ? <LoadingIcon className="h-5 w-5" /> : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterSettingsModal;