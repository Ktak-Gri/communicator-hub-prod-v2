
import React, { useEffect } from 'react';
import { useAppLogic } from './hooks/useAppLogic.ts';
import { 
    LoadingView, Header, LoginView, HomeView, AdminView, RPView, 
    TestView, HistoryView, SummaryView, SettingsView, PreflightView,
    LearningView, TrainerView, OneOnOneView 
} from './ui/Views.tsx';

export const App: React.FC = () => {
    const logic = useAppLogic();

    useEffect(() => {
        const bootLoader = document.getElementById('boot-loader');
        const rootElement = document.getElementById('root');
        
        if (!logic.isLoading) {
            if (bootLoader) {
                bootLoader.style.opacity = '0';
                setTimeout(() => {
                    bootLoader.style.display = 'none';
                    if (rootElement) rootElement.style.opacity = '1';
                }, 500);
            } else if (rootElement) {
                rootElement.style.opacity = '1';
            }
        }
    }, [logic.isLoading]);

    if (logic.isLoading) return <LoadingView />;
    
    if (logic.page === 'preflight_error' && logic.error) {
        return <PreflightView error={logic.error} onRetry={logic.refresh} />;
    }

    return (
        <div className="h-full bg-[#f8fafc] text-slate-900 font-sans selection:bg-sky-100">
            {logic.page !== 'login' && logic.page !== 'preflight_error' && logic.page !== null && (
                <Header logic={logic} />
            )}
            
            <main className="max-w-7xl mx-auto p-4 sm:p-6">
                {logic.page === 'login' && <LoginView logic={logic} />}
                {logic.page === 'home' && <HomeView logic={logic} />}
                {logic.page === 'admin' && <AdminView logic={logic} />}
                {logic.page === 'roleplay' && <RPView logic={logic} />}
                {logic.page === 'learning' && <LearningView logic={logic} />}
                {logic.page === 'learning-test' && <TestView logic={logic} />}
                {logic.page === 'learning-trainer' && <TrainerView logic={logic} />}
                {logic.page === 'one-on-one' && <OneOnOneView logic={logic} />}
                {logic.page === 'history' && <HistoryView logic={logic} />}
                {logic.page === 'center-summary' && <SummaryView logic={logic} />}
                {logic.page === 'center-registration' && <SettingsView logic={logic} />}
            </main>
        </div>
    );
};
