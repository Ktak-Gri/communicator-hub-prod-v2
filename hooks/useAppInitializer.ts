
import React, { useState, useEffect, useCallback } from 'react';
import { requestWithJsonp } from '../api.ts';
import { REQUIRED_BACKEND_VERSION } from '../constants.ts';
import { ActivePage, MasterSetting, Scenario, TestQuestion, MasterDataItem, Trainee } from '../types.ts';
import { dataConverter } from '../domain/data-converter.ts';

export const useAppInitializer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ reactNode: React.ReactNode; rawMessage: string } | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>(null);
  const [backendUpdateRequired, setBackendUpdateRequired] = useState(false);
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  
  const [traineeName, setTraineeName] = useState(() => {
    const val = localStorage.getItem('traineeName');
    return val ? val.replace(/"/g, '') : '';
  });
  const [currentCenter, setCurrentCenter] = useState(() => {
    const val = localStorage.getItem('currentCenter');
    return val ? val.replace(/"/g, '') : null;
  });
  const [adminToken, setAdminToken] = useState(() => {
    const val = localStorage.getItem('adminToken');
    return val ? val.replace(/"/g, '') : null;
  });

  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [masterSettings, setMasterSettings] = useState<MasterSetting[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [ngWords, setNgWords] = useState<string[]>([]);
  const [faqTopics, setFaqTopics] = useState<string[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [personalities, setPersonalities] = useState<MasterDataItem[]>([]);
  const [appSettings, setAppSettings] = useState<{[key: string]: any}>({});
  const [apiKey, setApiKey] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await requestWithJsonp('getSettings');
      const { data, version } = response;
      const bVersion = version || (data && data.version);
      setBackendVersion(bVersion);
      
      if (bVersion && bVersion < REQUIRED_BACKEND_VERSION) {
        setBackendUpdateRequired(true);
      } else {
        setBackendUpdateRequired(false);
      }

      if (data) {
        setMasterSettings((data.masterSettings || []).map(dataConverter.toMasterSetting));
        setTrainees((data.trainees || []).map(dataConverter.toTrainee));
        // dataConverter を使用して一貫性を確保
        setScenarios((data.scenarios || []).map((s: any, idx: number) => dataConverter.toScenario(s, idx)));
        setTestQuestions((data.testQuestions || []).map((q: any, idx: number) => dataConverter.toTestQuestion(q, idx)));
        
        setNgWords(data.ngWords || []);
        setFaqTopics(data.faqTopics || []);
        setPersonalities((data.personalities || []).map((p: any) => ({ name: p.name || p.性質名 || p.性質 || '' })));
        setAppSettings(data.appSettings || {});
        setApiKey(data.apiKey || null);
      }

      if (adminToken) {
        setActivePage('admin');
      } else if (traineeName) {
        setActivePage('home');
      } else {
        setActivePage('login');
      }
    } catch (err: any) {
      setError({ reactNode: null, rawMessage: err.message || "予期せぬエラー" });
      setActivePage('preflight_error');
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, traineeName]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const refreshSettings = useCallback(async () => {
    try {
        const { data } = await requestWithJsonp('getSettings');
        if (data) {
            setMasterSettings((data.masterSettings || []).map(dataConverter.toMasterSetting));
            setScenarios((data.scenarios || []).map((s: any, idx: number) => dataConverter.toScenario(s, idx)));
            setTestQuestions((data.testQuestions || []).map((q: any, idx: number) => dataConverter.toTestQuestion(q, idx)));
        }
    } catch (e) { console.error("Settings refresh failed", e); }
  }, []);

  return {
    isLoading, activePage, setActivePage, traineeName, setTraineeName, currentCenter, setCurrentCenter,
    adminToken, setAdminToken, trainees, masterSettings, setMasterSettings, scenarios, setScenarios,
    ngWords, setNgWords, faqTopics, setFaqTopics, testQuestions, setTestQuestions, 
    personalities, appSettings, setAppSettings, apiKey, fetchSettings, refreshSettings,
    backendUpdateRequired, backendVersion, error, handleIgnoreMismatch: () => setBackendUpdateRequired(false)
  };
};
