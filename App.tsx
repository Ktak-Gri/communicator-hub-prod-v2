
import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth.ts';
import { useAppLogic } from './hooks/useAppLogic.ts';
import { LoadingView, Header, LoginView, HomeView, AdminView, RPView, TestView, HistoryView, SummaryView, SettingsView, PreflightView } from './ui/Views.tsx';

export const App: React.FC = () => {
    const auth = useAuth();
    const logic = useAppLogic();

    // 静的ローダーを非表示にし、React rootを表示する
    useEffect(() => {
        const bootLoader = document.getElementById('boot-loader');
        const rootElement = document.getElementById('root');
        
        // ローディングが完了した、あるいはエラーが発生した場合に表示を切り替える
        if (!logic.isLoading || logic.error) {
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
    }, [logic.isLoading, logic.error]);

    if (logic.isLoading) return <LoadingView />;
    if (logic.error) return <PreflightView error={logic.error} onRetry={logic.refresh} />;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-sky-100">
            {logic.page !== 'login' && logic.page !== 'preflight_error' && logic.page !== null && (
                <Header logic={{...logic, ...auth}} />
            )}
            
            <main className="max-w-7xl mx-auto p-4 sm:p-6">
                {logic.page === 'login' && <LoginView logic={{...logic, ...auth}} />}
                {logic.page === 'home' && <HomeView logic={logic} />}
                {logic.page === 'admin' && <AdminView logic={{...logic, ...auth}} />}
                {logic.page === 'roleplay' && <RPView logic={{...logic, ...auth}} />}
                {logic.page === 'learning-test' && <TestView logic={{...logic, ...auth}} />}
                {logic.page === 'history' && <HistoryView logic={{...logic, ...auth}} />}
                {logic.page === 'center-summary' && <SummaryView logic={logic} />}
                {logic.page === 'center-registration' && <SettingsView logic={{...logic, ...auth}} />}
            </main>
        </div>
    );
};
