
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../apiClient.ts';
import { dataConverter } from '../domain/data-converter.ts';
import { ActivePage, MasterSetting, Scenario, TestQuestion, Trainee } from '../types.ts';

export const useAppLogic = () => {
    const [page, setPage] = useState<ActivePage>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [masters, setMasters] = useState<MasterSetting[]>([]);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
    const [trainees, setTrainees] = useState<Trainee[]>([]);

    const initialize = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.getSettings();
            if (res.data) {
                setMasters((res.data.masterSettings || []).map(dataConverter.toMasterSetting));
                setScenarios((res.data.scenarios || []).map((s: any, idx: number) => dataConverter.toScenario(s, idx)));
                setTestQuestions((res.data.testQuestions || []).map((q: any, idx: number) => dataConverter.toTestQuestion(q, idx)));
                setTrainees((res.data.trainees || []).map(dataConverter.toTrainee));
            }
            
            const savedName = localStorage.getItem('traineeName');
            const savedAdmin = localStorage.getItem('adminToken');
            
            if (savedAdmin) setPage('admin');
            else if (savedName) setPage('home');
            else setPage('login');
        } catch (e: any) {
            console.error("Initialization failed:", e);
            setError(e.message || "Failed to connect to backend");
            const savedName = localStorage.getItem('traineeName');
            const savedAdmin = localStorage.getItem('adminToken');
            if (savedAdmin) setPage('admin');
            else if (savedName) setPage('home');
            else setPage('preflight_error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        initialize(); 
    }, [initialize]);

    return {
        page, setPage, isLoading, error, 
        masters, scenarios, testQuestions, trainees,
        setScenarios, setTestQuestions, // 外部からの更新を許可
        refresh: initialize
    };
};
