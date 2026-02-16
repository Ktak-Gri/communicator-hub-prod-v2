import React, { useState, useEffect, useCallback } from 'react';
import { requestWithJsonp } from '../api.ts';
import { REQUIRED_BACKEND_VERSION } from '../constants.ts';
import { ActivePage, MasterSetting, Scenario, TestQuestion, MasterDataItem, Trainee } from '../types.ts';

const getFuzzy = (obj: any, keys: string[]) => {
    if (!obj) return '';
    const norm = (s: string) => String(s || "").replace(/[\s　]/g, '').toLowerCase();
    const targetKeys = keys.map(norm);
    const objKeys = Object.keys(obj);
    for (const k of objKeys) {
        if (targetKeys.includes(norm(k))) {
            const val = obj[k];
            return (val === null || val === undefined) ? '' : String(val).trim();
        }
    }
    return '';
};

const parseBool = (val: any): boolean => {
    if (typeof val === 'boolean') return val;
    const s = String(val).toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === '✅';
};

const parseSafeNumber = (val: any, fallback: number = 3): number => {
    if (typeof val === 'number') return val;
    const s = String(val || "").replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
    const n = parseInt(s.match(/\d+/)?.[0] || "", 10);
    return isNaN(n) ? fallback : n;
};

const normalizeMasterSetting = (s: any): MasterSetting => ({
    name: getFuzzy(s, ["センター名", "名称", "name"]),
    abbreviation: getFuzzy(s, ["略称", "センター略称", "abbreviation", "abbr"]),
    displayFlag: parseBool(getFuzzy(s, ["表示", "有効", "displayFlag", "visible"])),
    sortOrder: parseSafeNumber(getFuzzy(s, ["ソート順", "順序", "sortOrder"]), 999),
    showInSummary: parseBool(getFuzzy(s, ["概要表示", "showInSummary"]))
});

const normalizeTrainee = (t: any): Trainee => ({
    traineeName: getFuzzy(t, ["研修生名", "氏名", "研修生", "traineeName", "name"]),
    center: getFuzzy(t, ["センター", "所属", "center"]),
    endDate: getFuzzy(t, ["研修終了日", "終了日", "endDate"])
});

const normalizeScenario = (s: any, idx: number): Scenario => {
    const id = getFuzzy(s, ["ID", "シナリオID", "id", "管理番号"]);
    const name = getFuzzy(s, ["シナリオ名", "テスト名", "名称", "案件", "name", "タイトル"]);
    const initialInquiry = getFuzzy(s, ["最初の問い合わせ内容", "問い合わせ内容", "問題文", "initialInquiry", "内容"]);
    if (!name && !initialInquiry) return null as any;
    return {
        id: id || `S-${idx}`,
        name: name || `未設定シナリオ (${idx + 1})`,
        center: getFuzzy(s, ["センター", "対象", "所属", "center", "略称"]),
        difficulty: parseSafeNumber(getFuzzy(s, ["難易度", "レベル", "difficulty", "level"])),
        smartphonePlan: getFuzzy(s, ["スマホプラン", "スマートフォン", "smartphonePlan"]),
        lightPlan: getFuzzy(s, ["光プラン", "光", "lightPlan"]),
        initialInquiry: initialInquiry || '内容未設定',
        personality: getFuzzy(s, ["性質", "お客様の性質", "personality", "性格"])
    };
};

const normalizeTestQuestion = (q: any, idx: number): TestQuestion => {
    const id = getFuzzy(q, ["ID", "テストID", "id", "管理番号"]);
    const name = getFuzzy(q, ["テスト名", "問題名", "名称", "name", "タイトル", "問題"]);
    const questionText = getFuzzy(q, ["問題文", "内容", "質問", "questionText", "本文"]);
    if (!name && !questionText) return null as any;
    return {
        id: id || `T-${idx}`,
        name: name || `未設定問題 (${idx + 1})`,
        center: getFuzzy(q, ["センター", "対象", "center", "略称"]),
        difficulty: parseSafeNumber(getFuzzy(q, ["難易度", "レベル", "difficulty", "level"])),
        questionText: questionText || '問題文未設定',
        answerText: getFuzzy(q, ["解答", "回答", "模範解答", "answerText"]),
        smartphonePlan: getFuzzy(q, ["想定スマホプラン", "スマホプラン"]),
        lightPlan: getFuzzy(q, ["想定光プラン", "光プラン"])
    };
};

const normalizePersonality = (p: any): MasterDataItem => ({
    name: getFuzzy(p, ["性質名", "性質", "性格", "name"])
});

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
  const [knowledgeLevels, setKnowledgeLevels] = useState<MasterDataItem[]>([]);
  const [personalities, setPersonalities] = useState<MasterDataItem[]>([]);
  const [ageGroups, setAgeGroups] = useState<MasterDataItem[]>([]);
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
        setMasterSettings((data.masterSettings || []).map(normalizeMasterSetting));
        setTrainees((data.trainees || []).map(normalizeTrainee));
        setScenarios((data.scenarios || []).map(normalizeScenario).filter(Boolean));
        setNgWords(data.ngWords || []);
        setFaqTopics(data.faqTopics || []);
        setTestQuestions((data.testQuestions || []).map(normalizeTestQuestion).filter(Boolean));
        setPersonalities((data.personalities || []).map(normalizePersonality).filter(p => p.name));
        setAgeGroups(data.ageGroups || []);
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
            setMasterSettings((data.masterSettings || []).map(normalizeMasterSetting));
            setScenarios((data.scenarios || []).map(normalizeScenario).filter(Boolean));
            setTestQuestions((data.testQuestions || []).map(normalizeTestQuestion).filter(Boolean));
            setPersonalities((data.personalities || []).map(normalizePersonality).filter(p => p.name));
        }
    } catch (e) { console.error("Settings refresh failed", e); }
  }, []);

  return {
    isLoading, activePage, setActivePage, traineeName, setTraineeName, currentCenter, setCurrentCenter,
    adminToken, setAdminToken, trainees, masterSettings, setMasterSettings, scenarios, setScenarios,
    ngWords, setNgWords, faqTopics, setFaqTopics, testQuestions, setTestQuestions, knowledgeLevels,
    personalities, ageGroups, appSettings, setAppSettings, apiKey, fetchSettings, refreshSettings,
    backendUpdateRequired, backendVersion, error, handleIgnoreMismatch: () => setBackendUpdateRequired(false)
  };
};