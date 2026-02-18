
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

const CenterSettingsModal: React.FC<CenterSettingsModalProps> = ({ isOpen, onClose, masterSettings, onSave, isSaving }) => {
  const [internalSettings, setInternalSettings] = useState<MasterSetting[]>([]);
  useEffect(() => { if (isOpen) setInternalSettings(JSON.parse(JSON.stringify(masterSettings))); }, [isOpen, masterSettings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[120] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">センターマスタ設定</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-2 w-12 text-center">有効</th>
                <th className="p-2">センター名</th>
                <th className="p-2">略称</th>
                <th className="p-2 w-20">順序</th>
                <th className="p-2 w-12 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {internalSettings.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="p-2 text-center">
                    <input type="checkbox" checked={s.displayFlag} onChange={e => {
                      const next = [...internalSettings]; next[i].displayFlag = e.target.checked; setInternalSettings(next);
                    }} className="h-4 w-4 rounded text-sky-600" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={s.name} onChange={e => {
                      const next = [...internalSettings]; next[i].name = e.target.value; setInternalSettings(next);
                    }} className="w-full p-1 border rounded text-xs font-bold" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={s.abbreviation} onChange={e => {
                      const next = [...internalSettings]; next[i].abbreviation = e.target.value; setInternalSettings(next);
                    }} className="w-full p-1 border rounded text-xs font-mono font-bold" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={s.sortOrder} onChange={e => {
                      const next = [...internalSettings]; next[i].sortOrder = parseInt(e.target.value) || 999; setInternalSettings(next);
                    }} className="w-full p-1 border rounded text-xs font-bold" />
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => setInternalSettings(prev => prev.filter((_, idx) => idx !== i))} className="text-sky-500 hover:text-sky-700 transition-colors p-1">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setInternalSettings([...internalSettings, { name: '', abbreviation: '', displayFlag: true, sortOrder: 999 }])} className="mt-4 w-full p-3 bg-slate-100 rounded-xl font-black text-xs text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
            <PlusIcon className="h-4 w-4" /> 追加する
          </button>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <button onClick={async () => { if (await onSave(internalSettings)) onClose(); }} className="bg-sky-600 text-white font-black py-2 px-8 rounded-xl shadow-md hover:bg-sky-700 disabled:bg-slate-400 transition-all" disabled={isSaving}>
            {isSaving ? <LoadingIcon /> : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default CenterSettingsModal;
