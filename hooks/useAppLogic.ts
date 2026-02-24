console.log("useAppLogic file loaded");

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../apiClient.ts';
import { dataConverter } from '../domain/data-converter.ts';
import { ActivePage, MasterSetting, Scenario, TestQuestion, Trainee, MasterDataItem } from '../types.ts';
import { useAuth } from './useAuth';

export const useAppLogic = (
        auth: ReturnType<typeof useAuth>   // ← 引数で受け取る
    ) => {

        const { traineeName, adminToken } = auth;  // ← ここで参照

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

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await apiClient.getSettings();
                if (res.data) {
                    const nextMasters = (res.data.masterSettings || []).map(dataConverter.toMasterSetting);
                    const nextScenarios = (res.data.scenarios || []).map((s: any, idx: number) =>
                        dataConverter.toScenario(s, idx)
                    );
                    const nextTests = (res.data.testQuestions || []).map((q: any, idx: number) =>
                        dataConverter.toTestQuestion(q, idx)
                    );
                    const nextTrainees = (res.data.trainees || []).map(dataConverter.toTrainee);

                    setMasters(nextMasters);
                    setScenarios(nextScenarios);
                    setTestQuestions(nextTests);
                    setTrainees(nextTrainees);
                    setNgWords(res.data.ngWords || []);
                    setFaqTopics(res.data.faqTopics || []);
                }
            } catch (e: any) {
                console.error("Initialization Failed:", e);
                setError({ reactNode: null, rawMessage: `通信エラー: ${e.message}` });
                setPage('preflight_error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []); // ← 初回のみ
	
		useEffect(() => {
			if (adminToken) setPage('admin');
			else setPage('login');
		}, []);

		useEffect(() => {
			console.log("Current page:", page);
		}, [page]);


  return {
		page,
		setPage,
		isLoading,
		error,

		masters,
		scenarios,
		testQuestions,
		trainees,
		ngWords,
		faqTopics,
		personalities,

		traineeName,
		adminToken,

		// 👇 これらを復活させる
		setTraineeName: auth.setTraineeName,
		login: auth.login,
		adminLogin: auth.adminLogin,
		logout: () => {
			auth.logout();
			setPage('login');
		},
		updateCenter: auth.updateCenter,
		currentCenter: auth.currentCenter,

		setScenarios,
		setTestQuestions,
		setNgWords,
		setFaqTopics,
		setMasters,
	};

};
