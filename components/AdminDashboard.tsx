import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowPathIcon, PlusIcon, PencilIcon, Cog6ToothIcon, ListIcon, 
  ShieldCheckIcon, SparklesIcon, InformationCircleIcon, LogoutIcon,
  TrashIcon, BookOpenIcon, LoadingIcon
} from './Icons.tsx';
import { MasterSetting, Scenario, Trainee, TestQuestion, MasterDataItem } from '../types.ts';
import { addApiLogListener, requestWithJsonp } from '../api.ts';
import { useAdminDashboard } from '../hooks/useAdminDashboard.ts';
import ScenarioEditorModal from './ScenarioEditorModal.tsx';
import TestQuestionEditorModal from './TestQuestionEditorModal.tsx';
import NGWordsModal from './NGWordsModal.tsx';
import CenterSettingsModal from './CenterSettingsModal.tsx';
import FaqTopicsModal from './FaqTopicsModal.tsx';
import AutonomousSimulator from './AutonomousSimulator.tsx';
import { LogViewer } from './LogViewer.tsx';
import DeploymentGuide from './DeploymentGuide.tsx';
import SpreadsheetTest from './SpreadsheetTest.tsx';

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
  
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Partial<Scenario> | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [isNgModalOpen, setIsNgModalOpen] = useState(false);
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  useEffect(() => {
    addApiLogListener((message) => {
      setLogs((prev) => [...prev.slice(-99), message]);
    });
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const renderStars = (level: number) => (
    <div className="flex text-amber-400 gap-0.5">
      {[...Array(5)].map((_, j) => (
        <span key={j} className="text-[10px]">{j < (level || 0) ? '★' : '☆'}</span>
      ))}
    </div>
  );

  const handleDeleteScenario = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanId = String(id || "").trim();
    if (!cleanId || cleanId === "undefined" || cleanId === "") {
      alert("削除対象のIDを特定できません。再同期してください。");
      return;
    }
    if (!window.confirm(`「${name}」を本当に削除しますか？`)) return;
    
    const next = await deleteItem(cleanId, props.scenarios, 'シナリオ', ["ID", "シナリオ名", "センター", "スマホプラン", "光プラン", "最初の問い合わせ内容", "難易度", "性質"]);
    if (next) {
      props.onUpdateScenarios(next);
      setIsScenarioModalOpen(false);
      setEditingScenario(null);
    }
  };

  const handleDeleteTest = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanId = String(id || "").trim();
    if (!cleanId || cleanId === "undefined" || cleanId === "") {
      alert("IDを特定できません。");
      return;
    }
    if (!window.confirm(`問題「${name}」を本当に削除しますか？`)) return;
    
    const next = await deleteItem(cleanId, props.testQuestions, 'テスト問題', ["ID", "テスト名", "センター", "スマホプラン", "光プラン", "問題文", "解答", "難易度"]);
    if (next) {
      props.onUpdateTestQuestions(next);
      setIsTestModalOpen(false);
      setEditingTest(null);
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
            <p className="text-slate-300 font-bold text-[8px] mt-0.5 uppercase tracking-[0.2em] px-0.5">Professional Control Panel</p>
          </div>
          <div className="flex gap-2">
             <button onClick={props.onSync} className="bg-emerald-600 text-white font-black py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5 active:scale-95 text-[11px] cursor-pointer">
                <ArrowPathIcon className="h-3.5 w-3.5" /> <span>同期</span>
             </button>
             <button onClick={props.onLogout} className="bg-slate-100 text-slate-500 font-black py-1.5 px-3 rounded-lg hover:bg-slate-200 transition flex items-center gap-1.5 active:scale-95 text-[11px] cursor-pointer">
                <LogoutIcon className="h-3.5 w-3.5" /> <span>終了</span>
             </button>
          </div>
        </div>

        <nav className="flex overflow-x-auto border-b border-slate-50 mb-4 h-10 items-center">
          {[
            { id: 'scenarios', label: 'シナリオ', icon: <ListIcon className="h-3.5 w-3.5" /> },
            { id: 'tests', label: 'テスト問題', icon: <BookOpenIcon className="h-3.5 w-3.5" /> },
            { id: 'masters', label: 'マスタ設定', icon: <Cog6ToothIcon className="h-3.5 w-3.5" /> },
            { id: 'simulator', label: 'AIシミュ', icon: <SparklesIcon className="h-3.5 w-3.5" /> },
            { id: 'logs', label: '実施ログ', icon: <InformationCircleIcon className="h-3.5 w-3.5" /> },
            { id: 'maintenance', label: '保守設定', icon: <Cog6ToothIcon className="h-3.5 w-3.5" /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 font-black text-[11px] transition-all whitespace-nowrap flex items-center gap-1.5 border-b-4 h-full cursor-pointer ${activeTab === tab.id ? 'border-sky-600 text-sky-700 bg-sky-50/20' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-h-[400px]">
          {activeTab === 'scenarios' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-widest">
                   ロープレシナリオ一覧
                </h3>
                <button onClick={() => { setEditingScenario(null); setIsScenarioModalOpen(true); }} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 hover:bg-black transition-all shadow-sm text-[10px] cursor-pointer">
                  <PlusIcon className="h-3 w-3" /> <span>新規追加</span>
                </button>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[14px] text-left">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-4 w-14 text-center text-[11px]">No</th>
                      <th className="px-5 py-4 w-36 text-[11px]">ID</th>
                      <th className="px-5 py-4 w-36 border-l border-slate-100 text-[11px]">所属</th>
                      <th className="px-5 py-4 border-l border-slate-100 text-[11px]">シナリオ名</th>
                      <th className="px-5 py-4 w-24 text-center border-l border-slate-100 text-[11px]">難易度</th>
                      <th className="px-5 py-4 w-24 text-right text-[11px]">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {props.scenarios.map((s, idx) => {
                      const sid = String(s.id || (s as any).ID || "").trim();
                      const sname = String(s.name || (s as any).シナリオ名 || "");
                      return (
                        <tr key={sid} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setEditingScenario(s); setIsScenarioModalOpen(true); }}>
                          <td className="px-5 py-4 text-slate-400 font-bold text-center">{idx + 1}</td>
                          <td className="px-5 py-4 font-mono text-slate-400 truncate max-w-[140px]">{sid}</td>
                          <td className="px-5 py-4 border-l border-slate-100">
                             <span className="text-[10px] text-sky-500 font-black px-2 py-0.5 bg-sky-50 rounded border border-sky-100 uppercase">{s.center || '全般'}</span>
                          </td>
                          <td className="px-5 py-4 border-l border-slate-100">
                            <span className="font-black text-slate-700">{sname}</span>
                          </td>
                          <td className="px-5 py-4 flex justify-center border-l border-slate-100 items-center">{renderStars(s.difficulty || 0)}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1 relative z-10" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingScenario(s); setIsScenarioModalOpen(true); }}
                                className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-all cursor-pointer"
                              >
                                  <PencilIcon className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteScenario(sid, sname, e)}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                              >
                                  <TrashIcon className="h-4 w-4" />
                              </button>
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
                  <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-widest text-amber-600">
                     知識テスト問題一覧
                  </h3>
                  <button onClick={() => { setEditingTest(null); setIsTestModalOpen(true); }} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 hover:bg-black transition-all shadow-sm text-[10px] cursor-pointer">
                    <PlusIcon className="h-3 w-3" /> <span>問題追加</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-[14px] text-left">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-4 w-14 text-center text-[11px]">No</th>
                        <th className="px-5 py-4 w-36 text-[11px]">ID</th>
                        <th className="px-5 py-4 w-36 border-l border-slate-100 text-[11px]">所属</th>
                        <th className="px-5 py-4 border-l border-slate-100 text-[11px]">問題タイトル</th>
                        <th className="px-5 py-4 w-24 text-center border-l border-slate-100 text-[11px]">難易度</th>
                        <th className="px-5 py-4 w-24 text-right text-[11px]">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {props.testQuestions.map((q, idx) => {
                        const qid = String(q.id || (q as any).ID || "").trim();
                        const qname = String(q.name || (q as any).テスト名 || "");
                        return (
                          <tr key={qid} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setEditingTest(q); setIsTestModalOpen(true); }}>
                            <td className="px-5 py-4 text-slate-400 font-bold text-center">{idx + 1}</td>
                            <td className="px-5 py-4 font-mono text-slate-400 truncate max-w-[140px]">{qid}</td>
                            <td className="px-5 py-4 border-l border-slate-100">
                               <span className="text-[10px] text-amber-600 font-black px-2 py-0.5 bg-amber-50 rounded border border-amber-100 uppercase">{q.center || '全般'}</span>
                            </td>
                            <td className="px-5 py-4 border-l border-slate-100">
                              <span className="font-black text-slate-700">{qname}</span>
                            </td>
                            <td className="px-5 py-4 flex justify-center border-l border-slate-100 items-center">{renderStars(q.difficulty || 0)}</td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-1 relative z-10" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingTest(q); setIsTestModalOpen(true); }}
                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-all cursor-pointer"
                                  >
                                      <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => handleDeleteTest(qid, qname, e)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                  >
                                      <TrashIcon className="h-4 w-4" />
                                  </button>
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
                     <button onClick={() => setIsCenterModalOpen(true)} className="w-full p-4 bg-slate-50 rounded-2xl text-left font-bold text-slate-700 hover:bg-slate-100 flex justify-between items-center group transition-all cursor-pointer">
                        <span className="text-sm">センターマスタ設定</span>
                        <Cog6ToothIcon className="h-5 w-5 text-slate-300 group-hover:text-sky-500" />
                     </button>
                     <button onClick={() => setIsNgModalOpen(true)} className="w-full p-4 bg-slate-50 rounded-2xl text-left font-bold text-slate-700 hover:bg-slate-100 flex justify-between items-center group transition-all cursor-pointer">
                        <span className="text-sm">NGワード辞書管理</span>
                        <Cog6ToothIcon className="h-5 w-5 text-slate-300 group-hover:text-rose-500" />
                     </button>
                     <button onClick={() => setIsFaqModalOpen(true)} className="w-full p-4 bg-slate-50 rounded-2xl text-left font-bold text-slate-700 hover:bg-slate-100 flex justify-between items-center group transition-all cursor-pointer">
                        <span className="text-sm">知識テスト トピック設定</span>
                        <Cog6ToothIcon className="h-5 w-5 text-slate-300 group-hover:text-amber-500" />
                     </button>
                  </div>
               </div>
               <div className="bg-sky-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <h4 className="text-xl font-black mb-4">システム情報</h4>
                  <div className="space-y-4 text-[11px] font-bold opacity-80 uppercase tracking-widest">
                     <div className="flex justify-between border-b border-white/10 pb-2"><span>Version</span><span>V8.2.5 GOLD</span></div>
                     <div className="flex justify-between border-b border-white/10 pb-2"><span>Engine</span><span>Gemini 3 Pro</span></div>
                     <div className="flex justify-between"><span>Region</span><span>Tokyo/Japan</span></div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'simulator' && <AutonomousSimulator scenarios={props.scenarios} masterSettings={props.masterSettings} adminToken={props.adminToken} apiKey={props.apiKey} />}
          {activeTab === 'logs' && <LogViewer adminToken={props.adminToken} masterSettings={props.masterSettings} trainees={props.trainees} />}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SpreadsheetTest webAppUrl={props.webAppUrl} />
                <DeploymentGuide />
              </div>
            </div>
          )}
        </div>
      </div>

      {isSaving && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce z-[300]">
           <LoadingIcon className="h-5 w-5 text-sky-400" />
           <span className="text-xs font-black">サーバーを更新中...</span>
        </div>
      )}

      {isScenarioModalOpen && (
        <ScenarioEditorModal 
          onClose={() => setIsScenarioModalOpen(false)} 
          onSave={async (data) => { const next = await saveScenario(data, props.scenarios); if (next) props.onUpdateScenarios(next); setIsScenarioModalOpen(false); }} 
          onDelete={(editingScenario?.id || (editingScenario as any)?.ID) ? (e) => { 
            handleDeleteScenario(String(editingScenario?.id || (editingScenario as any)?.ID), String(editingScenario?.name || (editingScenario as any)?.シナリオ名), e); 
          } : undefined}
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
          onDelete={(editingTest?.id || (editingTest as any)?.ID) ? (e) => { 
            handleDeleteTest(String(editingTest?.id || (editingTest as any)?.ID), String(editingTest?.name || (editingTest as any)?.テスト名), e); 
          } : undefined}
          questionData={editingTest}
          masterSettings={props.masterSettings}
          personalities={props.personalities}
          isSaving={isSaving}
        />
      )}

      <NGWordsModal isOpen={isNgModalOpen} onClose={() => setIsNgModalOpen(false)} ngWords={props.ngWords} setNgWords={async (w) => {
          const tableData = [["NGワード"], ...w.map(row => [row])];
          await requestWithJsonp('updateSheet', { sheet: 'NGワード', data: tableData }, props.adminToken);
          props.onUpdateNgWords(w);
          return true;
      }} isSaving={isSaving} />

      <CenterSettingsModal isOpen={isCenterModalOpen} onClose={() => setIsCenterModalOpen(false)} masterSettings={props.masterSettings} onSave={async (s) => {
          const tableData = [["センター名", "略称", "表示", "ソート順", "概要表示"], ...s.map(r => [r.name, r.abbreviation, r.displayFlag, r.sortOrder, r.showInSummary])];
          await requestWithJsonp('updateSheet', { sheet: 'センターマスタ', data: tableData }, props.adminToken);
          props.onUpdateMasterSettings(s);
          return true;
      }} isSaving={isSaving} />

      <FaqTopicsModal isOpen={isFaqModalOpen} onClose={() => setIsFaqModalOpen(false)} faqTopics={props.faqTopics} onSaveTopics={async (t) => {
          const tableData = [["トピック"], ...t.map(row => [row])];
          await requestWithJsonp('updateSheet', { sheet: 'テストトピック', data: tableData }, props.adminToken);
          props.onUpdateFaqTopics(t);
          return true;
      }} isSaving={isSaving} />
    </div>
  );
};

export default AdminDashboard;