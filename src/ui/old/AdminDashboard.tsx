
import React, { useState } from 'react';
import { 
  ArrowPathIcon, PlusIcon, PencilIcon, Cog6ToothIcon, ListIcon, 
  ShieldCheckIcon, SparklesIcon, InformationCircleIcon, LogoutIcon,
  TrashIcon, BookOpenIcon, LoadingIcon
} from './Icons.tsx';
import { MasterSetting, Scenario, Trainee, TestQuestion, MasterDataItem } from '../types.ts';
import { apiClient } from '../apiClient.ts';
import { useAdminDashboard } from '../hooks/useAdminDashboard.ts';
import ScenarioEditorModal from './ScenarioEditorModal.tsx';
import TestQuestionEditorModal from './TestQuestionEditorModal.tsx';
import NGWordsModal from './NGWordsModal.tsx';
import CenterSettingsModal from './CenterSettingsModal.tsx';
import FaqTopicsModal from './FaqTopicsModal.tsx';
import AutonomousSimulator from './AutonomousSimulator.tsx';
import { LogViewer } from './LogViewer.tsx';

interface AdminDashboardProps {
  adminToken: string | null;
  onSync: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  masterSettings: MasterSetting[];
  onUpdateMasterSettings: (s: MasterSetting[]) => void;
  ngWords: string[];
  onUpdateNgWords: (w: string[]) => void;
  scenarios: Scenario[];
  onUpdateScenarios: (s: Scenario[]) => void;
  trainees: Trainee[];
  testQuestions: TestQuestion[];
  onUpdateTestQuestions: (q: TestQuestion[]) => void;
  faqTopics: string[];
  onUpdateFaqTopics: (t: string[]) => void;
  webAppUrl: string;
  spreadsheetId: string;
  appSettings: { [key: string]: any };
  onUpdateAppSettings: (s: any) => void;
  apiKey: string | null;
  onLogout: () => void;
  personalities: MasterDataItem[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { activeTab, setActiveTab, isSaving, saveScenario, saveTest, deleteItem } = useAdminDashboard(props.adminToken);

  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestQuestion | null>(null);
  const [isNgModalOpen, setIsNgModalOpen] = useState(false);
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  // インライン確認用のIDステート
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const renderStars = (level: number) => (
    <div className="flex text-amber-400 gap-0.5 scale-75 origin-left">
      {[...Array(5)].map((_, j) => (
        <span key={j} className="text-[10px]">{j < (level || 0) ? '★' : '☆'}</span>
      ))}
    </div>
  );

  /**
   * 削除処理のコア実行関数
   * 削除成功後にモーダルを閉じるように修正
   */
  const handleExecuteDelete = async (e: React.MouseEvent | null, item: any, type: 'シナリオ' | 'テスト問題') => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (isSaving) return;

    const targetId = String(item.id || item.internalId || "").trim();
    if (!targetId || targetId.startsWith('row-')) {
        alert("管理IDが未確定です。一度「同期」を行ってから削除してください。");
        return;
    }

    try {
      if (type === 'シナリオ') {
        const next = await deleteItem(targetId, props.scenarios, 'シナリオ');
        if (next) {
            props.onUpdateScenarios(next);
            // シナリオ削除成功時にモーダルを閉じる
            setIsScenarioModalOpen(false);
            setEditingScenario(null);
        }
      } else {
        const next = await deleteItem(targetId, props.testQuestions, 'テスト問題');
        if (next) {
            props.onUpdateTestQuestions(next);
            // テスト問題削除成功時にモーダルを閉じる
            setIsTestModalOpen(false);
            setEditingTest(null);
        }
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`削除に失敗しました: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left pb-10">
      <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-2 leading-none">
              <ShieldCheckIcon className="h-5 w-5 text-sky-600" />
              管理コンソール
            </h2>
          </div>
          <div className="flex gap-2">
             <button type="button" onClick={() => props.onSync()} className="bg-emerald-600 text-white font-black py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5 active:scale-95 text-[11px] cursor-pointer disabled:opacity-50" disabled={isSaving}>
                <ArrowPathIcon className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin' : ''}`} /> <span>同期</span>
             </button>
             <button type="button" onClick={props.onLogout} className="bg-slate-100 text-slate-500 font-black py-1.5 px-3 rounded-lg hover:bg-slate-200 transition flex items-center gap-1.5 active:scale-95 text-[11px] cursor-pointer">
                <LogoutIcon className="h-3.5 w-3.5" /> <span>終了</span>
             </button>
          </div>
        </div>

        <nav className="flex overflow-x-auto border-b border-slate-50 mb-4 h-10 items-center">
          {[
            { id: 'scenarios', label: 'シナリオ', icon: <ListIcon className="h-3.5 w-3.5" /> },
            { id: 'tests', label: 'テスト問題', icon: <BookOpenIcon className="h-3.5 w-3.5" /> },
            { id: 'masters', label: 'マスタ', icon: <Cog6ToothIcon className="h-3.5 w-3.5" /> },
            { id: 'simulator', label: 'AIシミュ', icon: <SparklesIcon className="h-3.5 w-3.5" /> },
            { id: 'logs', label: '実施ログ', icon: <InformationCircleIcon className="h-3.5 w-3.5" /> }
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 font-black text-[11px] transition-all whitespace-nowrap flex items-center gap-1.5 border-b-4 h-full cursor-pointer ${activeTab === tab.id ? 'border-sky-600 text-sky-700 bg-sky-50/20' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-h-[400px]">
          {activeTab === 'scenarios' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none">シナリオ一覧</h3>
                <button type="button" onClick={() => { setEditingScenario(null); setIsScenarioModalOpen(true); }} className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black flex items-center gap-1.5 hover:bg-black transition-all shadow-sm text-[9px] cursor-pointer h-7">
                  <PlusIcon className="h-3 w-3" /> <span>新規追加</span>
                </button>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[12px] text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-2 w-14 text-center text-[9px]">No</th>
                      <th className="px-5 py-2 w-32 text-[9px]">管理ID</th>
                      <th className="px-5 py-2 border-l border-slate-100 text-[9px]">所属</th>
                      <th className="px-5 py-2 border-l border-slate-100 text-[9px]">シナリオ名</th>
                      <th className="px-5 py-2 w-24 text-center border-l border-slate-100 text-[9px]">難易度</th>
                      <th className="px-5 py-2 text-right text-[9px] w-40">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {props.scenarios.map((s, idx) => {
                      const sid = String(s.id || s.internalId || "");
                      const isConfirming = deleteConfirmId === sid;
                      return (
                        <tr key={sid || idx} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setEditingScenario(s); setIsScenarioModalOpen(true); }}>
                          <td className="px-5 py-1 text-slate-400 font-bold text-center h-12 align-middle">{idx + 1}</td>
                          <td className="px-5 py-1 font-mono text-slate-400 truncate max-w-[120px] h-12 align-middle">{s.id || '-'}</td>
                          <td className="px-5 py-1 border-l border-slate-100 h-12 align-middle">
                              <span className="text-[8px] text-sky-500 font-black px-1.5 py-0.5 bg-sky-50 rounded border border-sky-100 uppercase leading-none inline-block">{s.center || '全般'}</span>
                          </td>
                          <td className="px-5 py-1 border-l border-slate-100 h-12 align-middle">
                            <span className="font-black text-slate-700 leading-none truncate block max-w-md">{s.name}</span>
                          </td>
                          <td className="px-5 py-1 flex justify-center border-l border-slate-100 items-center h-12 align-middle">{renderStars(s.difficulty || 0)}</td>
                          <td className="px-5 py-1 text-right h-12 align-middle" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1 px-1 min-w-[120px]">
                              {!isConfirming ? (
                                <>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setEditingScenario(s); setIsScenarioModalOpen(true); }} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer" title="編集"><PencilIcon className="h-4 w-4" /></button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(sid); }} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title="削除"><TrashIcon className="h-4 w-4" /></button>
                                </>
                              ) : (
                                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-1 duration-200">
                                  <span className="text-[8px] font-black text-rose-600 mr-1">削除?</span>
                                  <button type="button" onClick={(e) => handleExecuteDelete(e, s, 'シナリオ')} className="bg-rose-600 text-white px-2 py-1 rounded text-[9px] font-black hover:bg-rose-700 cursor-pointer shadow-sm">はい</button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[9px] font-black hover:bg-slate-300 cursor-pointer">戻る</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
             <div className="space-y-3 animate-fade-in">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest text-amber-600 leading-none">テスト問題一覧</h3>
                  <button type="button" onClick={() => { setEditingTest(null); setIsTestModalOpen(true); }} className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black flex items-center gap-1.5 hover:bg-black transition-all shadow-sm text-[9px] cursor-pointer h-7">
                    <PlusIcon className="h-3 w-3" /> <span>問題追加</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-[12px] text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-2 w-14 text-center text-[9px]">No</th>
                        <th className="px-5 py-2 w-32 text-[9px]">管理ID</th>
                        <th className="px-5 py-2 border-l border-slate-100 text-[9px]">所属</th>
                        <th className="px-5 py-2 border-l border-slate-100 text-[9px]">問題タイトル</th>
                        <th className="px-5 py-2 w-24 text-center border-l border-slate-100 text-[9px]">難易度</th>
                        <th className="px-5 py-2 text-right text-[9px] w-40">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {props.testQuestions.map((q, idx) => {
                        const qid = String(q.id || q.internalId || "");
                        const isConfirming = deleteConfirmId === qid;
                        return (
                          <tr key={qid || idx} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setEditingTest(q); setIsTestModalOpen(true); }}>
                            <td className="px-5 py-1 text-slate-400 font-bold text-center h-12 align-middle">{idx + 1}</td>
                            <td className="px-5 py-1 font-mono text-slate-400 truncate max-w-[140px] h-12 align-middle">{q.id || '-'}</td>
                            <td className="px-5 py-1 border-l border-slate-100 h-12 align-middle">
                               <span className="text-[8px] text-amber-600 font-black px-1.5 py-0.5 bg-amber-50 rounded border border-amber-100 uppercase leading-none inline-block">{q.center || '全般'}</span>
                            </td>
                            <td className="px-5 py-1 border-l border-slate-100 h-12 align-middle">
                              <span className="font-black text-slate-700 leading-none truncate block max-w-md">{q.name}</span>
                            </td>
                            <td className="px-5 py-1 flex justify-center border-l border-slate-100 items-center h-12 align-middle">{renderStars(q.difficulty || 0)}</td>
                            <td className="px-5 py-1 text-right h-12 align-middle" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1 px-1 min-w-[120px]">
                                {!isConfirming ? (
                                  <>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditingTest(q); setIsTestModalOpen(true); }} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer" title="編集"><PencilIcon className="h-4 w-4" /></button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(qid); }} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title="削除"><TrashIcon className="h-4 w-4" /></button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-1 duration-200">
                                    <span className="text-[8px] font-black text-rose-600 mr-1">削除?</span>
                                    <button type="button" onClick={(e) => handleExecuteDelete(e, q, 'テスト問題')} className="bg-rose-600 text-white px-2 py-1 rounded text-[9px] font-black hover:bg-rose-700 cursor-pointer shadow-sm">はい</button>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[9px] font-black hover:bg-slate-300 cursor-pointer">戻る</button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {activeTab === 'masters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-black text-slate-800 text-sm">共通マスタ設定</h4>
                  <div className="space-y-3">
                     <button type="button" onClick={() => setIsCenterModalOpen(true)} className="w-full p-4 bg-slate-50 rounded-2xl text-left font-bold text-slate-700 hover:bg-slate-100 flex justify-between items-center group transition-all cursor-pointer text-sm">
                        <span>センターマスタ設定</span>
                        <Cog6ToothIcon className="h-5 w-5 text-slate-300 group-hover:text-sky-500" />
                     </button>
                     <button type="button" onClick={() => setIsNgModalOpen(true)} className="w-full p-4 bg-slate-50 rounded-2xl text-left font-bold text-slate-700 hover:bg-slate-100 flex justify-between items-center group transition-all cursor-pointer text-sm">
                        <span>NGワード辞書管理</span>
                        <Cog6ToothIcon className="h-5 w-5 text-slate-300 group-hover:text-rose-500" />
                     </button>
                     <button type="button" onClick={() => setIsFaqModalOpen(true)} className="w-full p-4 bg-slate-50 rounded-2xl text-left font-bold text-slate-700 hover:bg-slate-100 flex justify-between items-center group transition-all cursor-pointer text-sm">
                        <span>知識テスト トピック設定</span>
                        <Cog6ToothIcon className="h-5 w-5 text-slate-300 group-hover:text-amber-500" />
                     </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'simulator' && <AutonomousSimulator scenarios={props.scenarios} masterSettings={props.masterSettings} adminToken={props.adminToken} apiKey={props.apiKey} />}
          {activeTab === 'logs' && <LogViewer adminToken={props.adminToken} masterSettings={props.masterSettings} trainees={props.trainees} />}
        </div>
      </div>

      {isSaving && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce z-[300]">
           <LoadingIcon className="h-5 w-5 text-sky-400" />
           <span className="text-xs font-black uppercase tracking-widest">Processing...</span>
        </div>
      )}

      {isScenarioModalOpen && (
        <ScenarioEditorModal 
          onClose={() => setIsScenarioModalOpen(false)} 
          onSave={async (data) => { const next = await saveScenario(data, props.scenarios); if (next) props.onUpdateScenarios(next); setIsScenarioModalOpen(false); }} 
          onDelete={(e, scenario) => handleExecuteDelete(e, scenario, 'シナリオ')}
          scenario={editingScenario} 
          masterSettings={props.masterSettings} 
          personalities={props.personalities} 
          isSaving={isSaving} 
        />
      )}

      {isTestModalOpen && (
        <TestQuestionEditorModal
          onClose={() => setIsTestModalOpen(false)}
          onSave={async (data) => { const next = await saveTest(data, props.testQuestions); if (next) props.onUpdateTestQuestions(next); setIsTestModalOpen(false); }}
          onDelete={(e, question) => handleExecuteDelete(e, question, 'テスト問題')}
          questionData={editingTest}
          masterSettings={props.masterSettings} 
          personalities={props.personalities} 
          isSaving={isSaving} 
        />
      )}

      <NGWordsModal isOpen={isNgModalOpen} onClose={() => setIsNgModalOpen(false)} ngWords={props.ngWords} setNgWords={async (w) => {
          const tableData = [["NGワード"], ...w.map(row => [row])];
          await apiClient.updateSheet('NGワード', tableData, props.adminToken);
          props.onUpdateNgWords(w);
          return true;
      }} isSaving={isSaving} />

      <CenterSettingsModal isOpen={isCenterModalOpen} onClose={() => setIsCenterModalOpen(false)} masterSettings={props.masterSettings} onSave={async (s) => {
          const tableData = [["センター名", "略称", "表示", "ソート順", "概要表示"], ...s.map(r => [r.name, r.abbreviation, r.displayFlag, r.sortOrder, r.showInSummary])];
          await apiClient.updateSheet('センターマスタ', tableData, props.adminToken);
          props.onUpdateMasterSettings(s);
          return true;
      }} isSaving={isSaving} />

      <FaqTopicsModal isOpen={isFaqModalOpen} onClose={() => setIsFaqModalOpen(false)} faqTopics={props.faqTopics} onSaveTopics={async (t) => {
          const tableData = [["トピック"], ...t.map(row => [row])];
          await apiClient.updateSheet('テストトピック', tableData, props.adminToken);
          props.onUpdateFaqTopics(t);
          return true;
      }} isSaving={isSaving} />
    </div>
  );
};

export default AdminDashboard;
