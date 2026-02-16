
import React, { useState } from 'react';
import { LoadingIcon, LogoutIcon, UserCircleIcon, ShieldCheckIcon } from './Icons.tsx';
import LoginScreen from './LoginScreen.tsx';
import HomePage from './HomePage.tsx';
import AdminDashboard from './AdminDashboard.tsx';
import RolePlayScreen from './RolePlayScreen.tsx';
import KnowledgeTest from './KnowledgeTest.tsx';
import HistoryPage from './HistoryPage.tsx';
import CenterSummaryPage from './CenterSummaryPage.tsx';
import CenterRegistrationPage from './CenterRegistrationPage.tsx';
import PreflightCheckPage from './PreflightCheckPage.tsx';
import AdminLoginModal from './AdminLoginModal.tsx';
import SettingsPanel from './SettingsPanel.tsx';
import { apiClient } from '../apiClient.ts';

export const LoadingView = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 z-[9999] animate-fade-in">
    <LoadingIcon className="w-12 h-12 text-sky-600 mb-4" />
    <div className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse">Initializing Hub...</div>
  </div>
);

export const Header = ({ logic }: { logic: any }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex justify-between items-center shadow-sm">
    <div className="flex items-center gap-4">
      <div 
        onClick={() => logic.setPage('home')} 
        className="text-lg font-black text-slate-900 cursor-pointer tracking-tighter hover:text-sky-600 transition-colors"
      >
        育成<span className="text-sky-600">HUB</span>
      </div>
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
        <UserCircleIcon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-black text-slate-600">{logic.traineeName} 様</span>
        <span className="text-[10px] text-slate-300">|</span>
        <span className="text-[11px] font-black text-sky-600">{logic.center || '所属未設定'}</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {logic.adminToken && logic.page !== 'admin' && (
        <button onClick={() => logic.setPage('admin')} className="p-2 text-slate-400 hover:text-sky-600 transition-colors" title="管理画面">
          <ShieldCheckIcon className="w-5 h-5" />
        </button>
      )}
      <button onClick={logic.logout} className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black text-slate-400 hover:text-rose-600 transition-colors group">
        <LogoutIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>ログアウト</span>
      </button>
    </div>
  </header>
);

export const LoginView = ({ logic }: { logic: any }) => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  return (
    <>
      <LoginScreen
        name={logic.traineeName}
        onNameChange={(v) => logic.setTraineeName(v)}
        onLogin={() => logic.login(logic.traineeName)}
        onAdminLoginClick={() => setIsAdminModalOpen(true)}
        isLoading={logic.isLoading}
        error={logic.error}
      />
      {isAdminModalOpen && (
        <AdminLoginModal
          onClose={() => setIsAdminModalOpen(false)}
          onLogin={async (pw) => {
            try {
              const res = await apiClient.adminLogin(pw);
              if (res?.token) {
                logic.setAdminToken(res.token);
                localStorage.setItem('adminToken', res.token);
                logic.setPage('admin');
                return { success: true };
              }
              return { success: false, error: 'パスワードが違います' };
            } catch (e) {
              return { success: false, error: '通信エラー' };
            }
          }}
        />
      )}
    </>
  );
};

export const HomeView = ({ logic }: { logic: any }) => <HomePage onNavigate={(p) => logic.setPage(p)} />;

export const AdminView = ({ logic }: { logic: any }) => (
  <AdminDashboard
    adminToken={logic.adminToken}
    onSync={logic.refresh}
    refreshSettings={logic.refresh}
    masterSettings={logic.masters}
    onUpdateMasterSettings={() => logic.refresh()}
    ngWords={[]}
    onUpdateNgWords={() => {}}
    scenarios={logic.scenarios}
    onUpdateScenarios={() => logic.refresh()}
    trainees={logic.trainees}
    testQuestions={logic.testQuestions}
    onUpdateTestQuestions={() => logic.refresh()}
    faqTopics={[]}
    onUpdateFaqTopics={() => {}}
    webAppUrl=""
    spreadsheetId=""
    appSettings={{}}
    onUpdateAppSettings={() => {}}
    apiKey={null}
    onLogout={logic.logout}
    personalities={[]}
  />
);

export const RPView = ({ logic }: { logic: any }) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);

  if (!sessionActive) {
    return (
      <SettingsPanel
        currentSettings={{ selectedCenter: logic.center, selectedScenario: null }}
        scenarios={logic.scenarios}
        masterSettings={logic.masters}
        apiKey={null}
        adminToken={logic.adminToken}
        onBack={() => logic.setPage('home')}
        onStart={({ selectedScenario }) => {
          setSelectedScenario(selectedScenario);
          setSessionActive(true);
        }}
      />
    );
  }

  return (
    <RolePlayScreen
      scenario={selectedScenario}
      traineeName={logic.traineeName}
      center={logic.center}
      apiKey={null}
      onBack={() => setSessionActive(false)}
      onComplete={async (transcript, scenario, persona) => {
        try {
          // FIX: Method exists in updated apiClient
          const analysis = await apiClient.analyzeRolePlay(scenario, transcript);
          alert(`評価完了: ${analysis.totalScore}点\n\n${analysis.summary}`);
          setSessionActive(false);
        } catch (e) {
          alert("評価に失敗しました");
          setSessionActive(false);
        }
      }}
      isAnalyzing={false}
    />
  );
};

export const TestView = ({ logic }: { logic: any }) => (
  <KnowledgeTest
    testQuestions={logic.testQuestions}
    faqTopics={[]}
    masterSettings={logic.masters}
    traineeName={logic.traineeName}
    center={logic.center}
    apiKey={null}
    adminToken={logic.adminToken}
    onBack={() => logic.setPage('home')}
  />
);

export const HistoryView = ({ logic }: { logic: any }) => (
  <HistoryPage
    traineeName={logic.traineeName}
    center={logic.center}
    scenarios={logic.scenarios}
    onBack={() => logic.setPage('home')}
  />
);

export const SummaryView = ({ logic }: { logic: any }) => (
  <CenterSummaryPage masterSettings={logic.masters} onBack={() => logic.setPage('home')} />
);

export const SettingsView = ({ logic }: { logic: any }) => (
  <CenterRegistrationPage
    traineeName={logic.traineeName}
    currentCenter={logic.center}
    displayableCenters={logic.masters}
    onLogout={logic.logout}
    onBack={() => logic.setPage('home')}
    onUpdateUserSettings={({ center }) => {
      localStorage.setItem('currentCenter', center.abbreviation);
      logic.refresh();
      logic.setPage('home');
    }}
  />
);

export const PreflightView = ({ error, onRetry }: { error: any; onRetry: any }) => (
  <PreflightCheckPage error={{ reactNode: null, rawMessage: error }} onRetry={onRetry} />
);
