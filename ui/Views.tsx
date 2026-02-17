
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
import LearningPage from './LearningPage.tsx';
import InteractiveQuestioningTrainer from './InteractiveQuestioningTrainer.tsx';
import OneOnOneHub from './OneOnOneHub.tsx';
import { apiClient } from '../apiClient.ts';

export const LoadingView = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 z-[9999] animate-fade-in">
    <LoadingIcon className="w-12 h-12 text-sky-600 mb-4" />
    <div className="text-slate-400 font-black text-[11px] tracking-[0.3em] uppercase animate-pulse">システム初期化中...</div>
  </div>
);

export const Header = ({ logic }: { logic: any }) => {
  const userDisplayName = logic.adminToken ? '管理者' : `${logic.traineeName}さん`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-5">
        <div 
          onClick={() => logic.setPage('home')} 
          className="text-lg font-black text-slate-900 cursor-pointer tracking-tighter flex items-center"
        >
          コミュニケーター育成<span className="text-sky-600">HUB</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
          <UserCircleIcon className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2 text-sm font-black">
            <span className="text-slate-600 whitespace-nowrap">{userDisplayName}</span>
            <span className="text-slate-300">|</span>
            <span className="text-sky-600 uppercase tracking-tight truncate max-w-[150px]">{logic.currentCenter || '未設定'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {logic.adminToken && logic.page !== 'admin' && (
          <button onClick={() => logic.setPage('admin')} className="p-2 text-slate-400 hover:text-sky-600 transition-colors" title="管理画面">
            <ShieldCheckIcon className="w-6 h-6" />
          </button>
        )}
        <button onClick={logic.logout} className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors group px-4 py-2">
          <LogoutIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-black">ログアウト</span>
        </button>
      </div>
    </header>
  );
};

export const LoginView = ({ logic }: { logic: any }) => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleTraineeLogin = async () => {
    setLoginError(null);
    const result = await logic.login(logic.traineeName);
    if (result.success) {
      logic.setPage('home');
    } else {
      setLoginError(result.error);
    }
  };

  return (
    <>
      <LoginScreen
        name={logic.traineeName}
        onNameChange={(v: string) => logic.setTraineeName(v)}
        onLogin={handleTraineeLogin}
        onAdminLoginClick={() => setIsAdminModalOpen(true)}
        isLoading={logic.isLoading}
        error={loginError}
      />
      {isAdminModalOpen && (
        <AdminLoginModal
          onClose={() => setIsAdminModalOpen(false)}
          onLogin={async (pw: string) => {
            const result = await logic.adminLogin(pw);
            if (result.success) {
              logic.setPage('admin');
              return { success: true };
            }
            return { success: false, error: 'パスワードが違います' };
          }}
        />
      )}
    </>
  );
};

export const HomeView = ({ logic }: { logic: any }) => <HomePage onNavigate={(p: any) => logic.setPage(p)} />;

export const AdminView = ({ logic }: { logic: any }) => (
  <AdminDashboard
    adminToken={logic.adminToken}
    onSync={logic.refresh}
    refreshSettings={logic.refresh}
    masterSettings={logic.masters}
    onUpdateMasterSettings={(next: any) => logic.setMasters(next)}
    ngWords={logic.ngWords}
    onUpdateNgWords={(next: any) => logic.setNgWords(next)}
    scenarios={logic.scenarios}
    onUpdateScenarios={(next: any) => logic.setScenarios(next)}
    trainees={logic.trainees}
    testQuestions={logic.testQuestions}
    onUpdateTestQuestions={(next: any) => logic.setTestQuestions(next)}
    faqTopics={logic.faqTopics}
    onUpdateFaqTopics={(next: any) => logic.setFaqTopics(next)}
    webAppUrl=""
    spreadsheetId=""
    appSettings={{}}
    onUpdateAppSettings={() => {}}
    apiKey={null}
    onLogout={logic.logout}
    personalities={logic.personalities}
  />
);

export const RPView = ({ logic }: { logic: any }) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);

  if (!sessionActive) {
    return (
      <SettingsPanel
        currentSettings={{ selectedCenter: logic.currentCenter, selectedScenario: null }}
        scenarios={logic.scenarios}
        masterSettings={logic.masters}
        apiKey={null}
        adminToken={logic.adminToken}
        onBack={() => logic.setPage('home')}
        onStart={({ selectedScenario }: any) => {
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
      center={logic.currentCenter}
      apiKey={null}
      onBack={() => setSessionActive(false)}
      onComplete={async (transcript: any, scenario: any, persona: any) => {
        try {
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
    faqTopics={logic.faqTopics}
    masterSettings={logic.masters}
    traineeName={logic.traineeName}
    center={logic.currentCenter}
    apiKey={null}
    adminToken={logic.adminToken}
    onBack={() => logic.setPage('learning')}
  />
);

export const HistoryView = ({ logic }: { logic: any }) => (
  <HistoryPage
    traineeName={logic.traineeName}
    center={logic.currentCenter}
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
    currentCenter={logic.currentCenter}
    displayableCenters={logic.masters}
    onLogout={logic.logout}
    onBack={() => logic.setPage('home')}
    onUpdateUserSettings={({ center }: any) => {
      logic.updateCenter(center.abbreviation);
      logic.setPage('home');
    }}
  />
);

export const PreflightView = ({ error, onRetry }: { error: any; onRetry: any }) => (
  <PreflightCheckPage error={error} onRetry={onRetry} />
);

export const LearningView = ({ logic }: { logic: any }) => (
  <LearningPage onNavigate={(p: any) => logic.setPage(p)} />
);

export const TrainerView = ({ logic }: { logic: any }) => (
  <InteractiveQuestioningTrainer
    onBack={() => logic.setPage('learning')}
    traineeName={logic.traineeName}
    center={logic.currentCenter}
    apiKey={null}
    adminToken={logic.adminToken}
  />
);

export const OneOnOneView = ({ logic }: { logic: any }) => (
  <OneOnOneHub
    traineeName={logic.traineeName}
    trainees={logic.trainees}
    currentCenter={logic.currentCenter}
    onComplete={(transcript: any, scenario: any, persona: any) => {
      console.log("1on1 Complete", transcript);
      logic.setPage('home');
    }}
    isAnalyzing={false}
    onBack={() => logic.setPage('home')}
  />
);
