import React, { useState, useEffect, useCallback } from 'react';
import { useAppInitializer } from './hooks/useAppInitializer.ts';
import { requestWithJsonp, getEffectiveUrl } from './api.ts';
import { Scenario, TranscriptItem, Center, MasterSetting } from './types.ts';

// 元の安定したコンポーネント群をインポート
import LoginScreen from './components/LoginScreen.tsx';
import HomePage from './components/HomePage.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import RolePlayScreen from './components/RolePlayScreen.tsx';
import HistoryPage from './components/HistoryPage.tsx';
import CenterSummaryPage from './components/CenterSummaryPage.tsx';
import CenterRegistrationPage from './components/CenterRegistrationPage.tsx';
import PreflightCheckPage from './components/PreflightCheckPage.tsx';
import BackendUpdateRequiredPage from './components/BackendUpdateRequiredPage.tsx';
import AdminLoginModal from './components/AdminLoginModal.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import OneOnOneHub from './components/OneOnOneHub.tsx';
import InteractiveQuestioningTrainer from './components/InteractiveQuestioningTrainer.tsx';
import FeedbackModal from './components/FeedbackModal.tsx';
import { LogoutIcon, UserCircleIcon, ShieldCheckIcon } from './components/Icons.tsx';

export const App: React.FC = () => {
  // Fix: Added missing destructured variables (ngWords, setNgWords, setAppSettings) used in AdminDashboard component
  const {
    isLoading, activePage, setActivePage, traineeName, setTraineeName, currentCenter, setCurrentCenter,
    adminToken, setAdminToken, trainees, masterSettings, setMasterSettings, scenarios, setScenarios, 
    testQuestions, setTestQuestions, faqTopics, setFaqTopics,
    ngWords, setNgWords, // Added these to destructuring
    knowledgeLevels, personalities, ageGroups, appSettings, setAppSettings, // Added setAppSettings here
    apiKey, fetchSettings, refreshSettings,
    backendUpdateRequired, backendVersion, error, handleIgnoreMismatch
  } = useAppInitializer();

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // ログイン中のローカルステート
  const [feedbackData, setFeedbackData] = useState<any | null>(null);

  // HTML側の初期ローダーを消去する
  useEffect(() => {
    if (!isLoading) {
      const loader = document.getElementById('boot-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
      const root = document.getElementById('root');
      if (root) root.style.opacity = '1';
    }
  }, [isLoading]);

  // 1. React側のローディング表示（バックアップ用）
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0f172a] z-[9999]">
        <div className="spinner mb-4"></div>
        <div className="text-sky-400 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse">Initializing System</div>
      </div>
    );
  }

  // 2. 接続エラー表示
  if (activePage === 'preflight_error') {
    return <PreflightCheckPage error={error!} onRetry={fetchSettings} />;
  }

  // 3. バージョン不一致表示
  if (backendUpdateRequired && !localStorage.getItem('bypassVersionCheck')) {
    return <BackendUpdateRequiredPage backendVersion={backendVersion} expectedVersion="V6.22.20" onIgnoreMismatch={handleIgnoreMismatch} />;
  }

  // --- ハンドラー群 ---

  const handleLogin = async () => {
    if (!traineeName.trim() || isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const res = await requestWithJsonp('validateTrainee', { name: traineeName.trim() });
      if (res.data) {
        const finalName = res.data.研修生名 || res.data.traineeName || traineeName;
        setTraineeName(finalName);
        localStorage.setItem('traineeName', JSON.stringify(finalName));
        const centerName = res.data.センター || res.data.center || null;
        if (centerName) {
            setCurrentCenter(centerName);
            localStorage.setItem('currentCenter', JSON.stringify(centerName));
        }
        setActivePage('home');
      } else {
        alert(`「${traineeName}」様は研修生名簿に登録されていません。`);
      }
    } catch (e) {
      alert("ログインに失敗しました。GASのURL設定または権限を確認してください。");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminAuth = async (password: string) => {
    try {
      const res = await requestWithJsonp('adminLogin', { password });
      if (res.data && res.data.token) {
        setAdminToken(res.data.token);
        localStorage.setItem('adminToken', JSON.stringify(res.data.token));
        setActivePage('admin');
        setIsAdminModalOpen(false);
        return { success: true };
      }
      return { success: false, error: 'パスワードが正しくありません' };
    } catch (e) {
      return { success: false, error: '通信エラーが発生しました' };
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setTraineeName('');
    setCurrentCenter(null);
    setAdminToken(null);
    setActivePage('login');
  };

  const handleCompleteRP = async (transcript: TranscriptItem[], scenario: Scenario, persona: any) => {
    setIsAnalyzing(true);
    try {
      const { data: analysisString } = await requestWithJsonp('analyzeRolePlay', {
        scenarioName: scenario.name,
        initialInquiry: scenario.initialInquiry,
        persona,
        transcriptText: JSON.stringify(transcript),
        ngWords: []
      });
      const analysis = JSON.parse(analysisString);
      const finalFeedback = {
        ...analysis,
        traineeName,
        center: currentCenter || '不明',
        scenarioName: scenario.name,
        fullTranscript: transcript,
        startTime: new Date().toLocaleString(),
        persona
      };
      await requestWithJsonp('saveRolePlayLog', finalFeedback);
      setFeedbackData(finalFeedback);
    } catch (e) {
      alert("評価の生成に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-sky-100">
      {/* ヘッダー */}
      {activePage !== 'login' && activePage !== null && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div onClick={() => setActivePage('home')} className="text-lg font-black text-slate-900 cursor-pointer tracking-tighter hover:text-sky-600 transition-colors">
              育成<span className="text-sky-600">HUB</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
              <UserCircleIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-black text-slate-600">{traineeName} 様</span>
              <span className="text-[10px] text-slate-300">|</span>
              <span className="text-[11px] font-black text-sky-600">{currentCenter || '所属未設定'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {adminToken && activePage !== 'admin' && (
              <button onClick={() => setActivePage('admin')} className="p-2 text-slate-400 hover:text-sky-600 transition-colors"><ShieldCheckIcon className="w-5 h-5" /></button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-black text-slate-400 hover:text-rose-600 transition-colors group">
              <LogoutIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>ログアウト</span>
            </button>
          </div>
        </header>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 overflow-hidden">
        {activePage === 'login' && (
          <LoginScreen 
            name={traineeName} 
            onNameChange={setTraineeName} 
            onLogin={handleLogin} 
            onAdminLoginClick={() => setIsAdminModalOpen(true)} 
            isLoading={isLoggingIn} 
            error={null} 
          />
        )}

        {activePage === 'home' && <HomePage onNavigate={setActivePage} />}

        {activePage === 'roleplay' && !selectedScenario && (
          <SettingsPanel 
            currentSettings={{ selectedCenter: currentCenter, selectedScenario: null }} 
            onStart={({ selectedScenario }) => setSelectedScenario(selectedScenario)} 
            scenarios={scenarios} 
            masterSettings={masterSettings} 
            apiKey={apiKey} 
            adminToken={adminToken} 
          />
        )}

        {activePage === 'roleplay' && selectedScenario && (
          <RolePlayScreen 
            scenario={selectedScenario} 
            traineeName={traineeName} 
            center={currentCenter} 
            apiKey={apiKey} 
            onBack={() => setSelectedScenario(null)} 
            onComplete={handleCompleteRP} 
            isAnalyzing={isAnalyzing} 
          />
        )}

        {activePage === 'one-on-one' && (
            <OneOnOneHub 
                traineeName={traineeName} 
                trainees={trainees} 
                currentCenter={currentCenter} 
                onComplete={() => {}} 
                isAnalyzing={false} 
            />
        )}

        {activePage === 'learning' && (
          <InteractiveQuestioningTrainer 
            onBack={() => setActivePage('home')} 
            traineeName={traineeName} 
            center={currentCenter} 
            apiKey={apiKey} 
            adminToken={adminToken} 
          />
        )}

        {activePage === 'history' && (
          <HistoryPage 
            traineeName={traineeName} 
            center={currentCenter} 
            scenarios={scenarios} 
          />
        )}

        {activePage === 'center-summary' && <CenterSummaryPage masterSettings={masterSettings} />}

        {activePage === 'center-registration' && (
          <CenterRegistrationPage 
            traineeName={traineeName} 
            currentCenter={currentCenter} 
            onUpdateUserSettings={({ center }) => {
              setCurrentCenter(center.abbreviation);
              localStorage.setItem('currentCenter', JSON.stringify(center.abbreviation));
              setActivePage('home');
            }} 
            displayableCenters={masterSettings.filter(m => m.displayFlag)} 
            onLogout={handleLogout} 
          />
        )}

        {activePage === 'admin' && (
          <AdminDashboard 
            adminToken={adminToken} 
            onSync={fetchSettings} 
            refreshSettings={refreshSettings}
            masterSettings={masterSettings}
            onUpdateMasterSettings={setMasterSettings}
            ngWords={ngWords}
            onUpdateNgWords={setNgWords}
            scenarios={scenarios}
            onUpdateScenarios={setScenarios}
            trainees={trainees}
            testQuestions={testQuestions}
            onUpdateTestQuestions={setTestQuestions}
            faqTopics={faqTopics}
            onUpdateFaqTopics={setFaqTopics}
            webAppUrl={getEffectiveUrl() || ''}
            spreadsheetId=""
            appSettings={appSettings}
            onUpdateAppSettings={setAppSettings}
            apiKey={apiKey}
            onLogout={handleLogout}
            personalities={personalities}
          />
        )}
      </main>

      {/* モーダル群 */}
      {isAdminModalOpen && <AdminLoginModal onClose={() => setIsAdminModalOpen(false)} onLogin={handleAdminAuth} />}
      {feedbackData && <FeedbackModal feedback={feedbackData} onClose={() => setFeedbackData(null)} />}
    </div>
  );
};

export default App;