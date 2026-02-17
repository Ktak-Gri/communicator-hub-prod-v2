
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../apiClient.ts';
import { dataConverter } from '../domain/data-converter.ts';
import { ActivePage, MasterSetting, Scenario, TestQuestion, Trainee, MasterDataItem } from '../types.ts';

export const useAppLogic = () => {
    const [page, setPage] = useState<ActivePage>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<{ reactNode: any; rawMessage: string } | null>(null);

    const [masters, setMasters] = useState<MasterSetting[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [ngWords, setNgWords] = useState<string[]>([]);
    const [faqTopics, setFaqTopics] = useState<string[]>([]);
    const [personalities, setPersonalities] = useState<MasterDataItem[]>([]);

    const [traineeName, setTraineeName] = useState(() => localStorage.getItem('traineeName')?.replace(/"/g, '') || '');
    const [currentCenter, setCurrentCenter] = useState(() => localStorage.getItem('currentCenter')?.replace(/"/g, '') || null);
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken')?.replace(/"/g, '') || null);

    const isInitialized = useRef(false);

    const initialize = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await apiClient.getSettings();
            if (res.data) {
                // 正規化ロジックを通してからStateへセット
                const nextMasters = (res.data.masterSettings || []).map(dataConverter.toMasterSetting);
                const nextScenarios = (res.data.scenarios || []).map((s: any, idx: number) => dataConverter.toScenario(s, idx));
                const nextTests = (res.data.testQuestions || []).map((q: any, idx: number) => dataConverter.toTestQuestion(q, idx));
                const nextTrainees = (res.data.trainees || []).map(dataConverter.toTrainee);

                setMasters(nextMasters);
                setScenarios(nextScenarios);
                setTestQuestions(nextTests);
                setTrainees(nextTrainees);
                setNgWords(res.data.ngWords || []);
                setFaqTopics(res.data.faqTopics || []);
                setPersonalities((res.data.personalities || []).map((p: any) => ({ name: p.name || p.性質名 || p.性質 || '' })));
            }
            
            // 初回起動時のみページ遷移判定
            if (!isInitialized.current) {
                if (adminToken) setPage('admin');
                else if (traineeName) setPage('home');
                else setPage('login');
                isInitialized.current = true;
            }
        } catch (e: any) {
            console.error("Initialization Failed:", e);
            setError({ reactNode: null, rawMessage: `通信エラー: ${e.message}` });
            if (!isInitialized.current) setPage('preflight_error');
        } finally {
            setIsLoading(false);
        }
    }, [adminToken, traineeName]);

    useEffect(() => { initialize(); }, []);

    return {
        page, setPage, isLoading, error, 
        masters, scenarios, testQuestions, trainees,
        ngWords, faqTopics, personalities,
        traineeName, setTraineeName,
        currentCenter, setCurrentCenter,
        adminToken, setAdminToken,
        setScenarios, setTestQuestions,
        setNgWords, setFaqTopics, setMasters,
        refresh: initialize,
        updateCenter: (abbr: string) => {
            setCurrentCenter(abbr);
            localStorage.setItem('currentCenter', JSON.stringify(abbr));
        },
        logout: () => {
            localStorage.clear();
            setTraineeName('');
            setAdminToken(null);
            setCurrentCenter(null);
            setPage('login');
        },
        login: async (name: string) => {
            try {
                const res = await apiClient.validateTrainee(name);
                if (res.data) {
                    const finalName = res.data.研修生名 || res.data.traineeName || name;
                    const center = res.data.センター || res.data.center || null;
                    setTraineeName(finalName);
                    localStorage.setItem('traineeName', JSON.stringify(finalName));
                    if (center) {
                        setCurrentCenter(center);
                        localStorage.setItem('currentCenter', JSON.stringify(center));
                    }
                    return { success: true };
                }
                return { success: false, error: '研修生名が登録されていません。' };
            } catch (e: any) { return { success: false, error: "サーバー接続に失敗しました。" }; }
        },
        adminLogin: async (pw: string) => {
            try {
                const res = await apiClient.adminLogin(pw);
                if (res.data?.token) {
                    setAdminToken(res.data.token);
                    localStorage.setItem('adminToken', JSON.stringify(res.data.token));
                    return { success: true };
                }
                return { success: false };
            } catch (e) { return { success: false }; }
        }
    };
};
