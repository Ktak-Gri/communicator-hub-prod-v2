
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../apiClient.ts';
import { ActivePage, MasterSetting, Scenario, TestQuestion, Trainee } from '../types.ts';

export const useAppLogic = () => {
    // UI State
    const [page, setPage] = useState<ActivePage>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Auth & Profile State
    const [traineeName, setTraineeName] = useState(() => localStorage.getItem('traineeName')?.replace(/"/g, '') || '');
    const [center, setCenter] = useState(() => localStorage.getItem('currentCenter')?.replace(/"/g, '') || null);
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken')?.replace(/"/g, '') || null);

    // Master Data
    const [masters, setMasters] = useState<MasterSetting[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
    const [trainees, setTrainees] = useState<Trainee[]>([]);

    const syncStorage = (key: string, value: string | null) => {
        if (value) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
    };

    const initialize = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.getSettings();
            if (res.data) {
                setMasters(res.data.masterSettings || []);
                setScenarios(res.data.scenarios || []);
                setTestQuestions(res.data.testQuestions || []);
                setTrainees(res.data.trainees || []);
            }
            
            if (adminToken) setPage('admin');
            else if (traineeName) setPage('home');
            else setPage('login');
        } catch (e: any) {
            setError(e.message);
            setPage('preflight_error');
        } finally {
            setIsLoading(false);
        }
    }, [adminToken, traineeName]);

    useEffect(() => { initialize(); }, [initialize]);

    const login = async (name: string) => {
        setIsLoading(true);
        try {
            const data = await apiClient.validateTrainee(name);
            if (data) {
                const finalName = data.traineeName || data.研修生名 || data.研修生 || name;
                const finalCenter = data.center || data.センター || null;
                setTraineeName(finalName);
                setCenter(finalCenter);
                syncStorage('traineeName', finalName);
                syncStorage('currentCenter', finalCenter);
                setPage('home');
            } else {
                throw new Error("名前が見つかりません。名簿に登録されているか確認してください。");
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setTraineeName('');
        setCenter(null);
        setAdminToken(null);
        syncStorage('traineeName', null);
        syncStorage('currentCenter', null);
        syncStorage('adminToken', null);
        setPage('login');
    };

    return {
        page, setPage, isLoading, error, 
        traineeName, center, adminToken,
        masters, scenarios, testQuestions, trainees,
        login, logout, refresh: initialize,
        setTraineeName, setAdminToken
    };
};
