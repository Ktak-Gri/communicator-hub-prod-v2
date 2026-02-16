import { useState, useEffect, useCallback } from 'react';
import { ActivePage, MasterSetting, Scenario, TestQuestion, Trainee } from './types.ts';
import { apiClient } from './apiClient.ts';
import { domainMaster } from './domain-master.ts';
import { domainLearning } from './domain-learning.ts';

export const useAppState = (initialPage: ActivePage) => {
  const [page, setPage] = useState<ActivePage>(initialPage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [masters, setMasters] = useState<MasterSetting[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [currentCenter, setCurrentCenter] = useState(() => {
    const saved = localStorage.getItem('currentCenter');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return saved || null;
    }
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getSettings();
      if (res.status === 'success' && res.data) {
        setMasters((res.data.masterSettings || []).map(domainMaster.normalizeMasterSetting));
        setScenarios((res.data.scenarios || []).map(domainMaster.normalizeScenario));
        setQuestions((res.data.testQuestions || []).map(domainLearning.normalizeQuestion));
        setTrainees(res.data.trainees || []);
      }
    } catch (e: any) {
      console.error("Fetch Settings Error:", e);
      setError(e.message || "予期せぬエラーが発生しました");
      // データ取得に失敗しても、認証済みでなければログイン画面へ
      if (!localStorage.getItem('traineeName') && !localStorage.getItem('adminToken')) {
        setPage('login');
      } else if (page === null) {
        setPage('preflight_error');
      }
    } finally {
      // データの有無に関わらず、初期化処理が終わったらロード画面を閉じる
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const updateCenter = (abbr: string) => {
    setCurrentCenter(abbr);
    localStorage.setItem('currentCenter', JSON.stringify(abbr));
  };

  return { 
    page, setPage, isLoading, error, masters, scenarios, questions, trainees, 
    currentCenter, updateCenter, refresh: fetchData 
  };
};