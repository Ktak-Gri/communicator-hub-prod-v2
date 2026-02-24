import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAppLogic } from './hooks/useAppLogic';
import { attachSessionRefresh } from './apiClient';
import {
  LoadingView,
  Header,
  LoginView,
  AdminView,
  HomeView,
  LearningView,
  RPView,
  TestView,
  HistoryView,
  SettingsView,
  SummaryView,
  TrainerView,
  OneOnOneView,
  PreflightView
} from './ui/Views';

export const App: React.FC = () => {

  const auth = useAuth();                 // ← ここ1回だけ
  const logic = useAppLogic(auth);        // ← authを渡す

  useEffect(() => {
    attachSessionRefresh(auth.refreshActivity);
  }, [auth.refreshActivity]);

    // 👇 これを追加する
  useEffect(() => {
    const bootLoader = document.getElementById('boot-loader');
    if (!logic.isLoading && bootLoader) {
      bootLoader.style.opacity = '0';
      setTimeout(() => {
        bootLoader.remove();
      }, 300);
    }
  }, [logic.isLoading]);
  
  // if (logic.isLoading) return <LoadingView />;


	useEffect(() => {
  console.log("Current page:", logic.page);
}, [logic.page]);

	return (
		<>
			<Header logic={logic} auth={auth} />

			{logic.page === 'login' && <LoginView logic={logic} />}
			{logic.page === 'admin' && <AdminView logic={logic} />}
			{logic.page === 'home' && <HomeView logic={logic} />}
			{logic.page === 'learning' && <LearningView logic={logic} />}
			{logic.page === 'roleplay' && <RPView logic={logic} />}
			{logic.page === 'learning-test' && <TestView logic={logic} />}
			{logic.page === 'history' && <HistoryView logic={logic} />}
			{logic.page === 'settings' && <SettingsView logic={logic} />}
			{logic.page === 'summary' && <SummaryView logic={logic} />}
			{logic.page === 'trainer' && <TrainerView logic={logic} />}
			{logic.page === 'one-on-one' && <OneOnOneView logic={logic} />}
			{logic.page === 'preflight_error' && (
				<PreflightView error={logic.error} onRetry={logic.refresh} />
			)}
		</>
	);
};
