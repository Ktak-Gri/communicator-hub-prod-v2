
import { useState } from 'react';
import { apiClient } from '../apiClient.ts';
import { generateAiContentAsync } from '../api.ts';
import { Scenario, TranscriptItem, Center } from '../types.ts';

export const useAppActions = (
  setTraineeName: (name: string) => void,
  setCurrentCenter: (center: string | null) => void,
  setAdminToken: (token: string | null) => void,
  setActivePage: (page: any) => void,
  traineeName: string,
  currentCenter: Center | null,
  adminToken: string | null
) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('traineeName');
    localStorage.removeItem('currentCenter');
    localStorage.removeItem('adminToken');
    setTraineeName('');
    setCurrentCenter(null);
    setAdminToken(null);
    setActivePage('login');
  };

  const handleAdminLogin = async (password: string) => {
    try {
      const data = await apiClient.adminLogin(password);
      if (data?.token) {
        setAdminToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setActivePage('admin');
        return { success: true };
      }
      return { success: false, error: '認証失敗' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const handleCompleteRolePlay = async (transcript: TranscriptItem[], scenario: Scenario, persona: any) => {
    setIsAnalyzing(true);
    try {
      const { data } = await generateAiContentAsync({
        schemaName: 'analyzeRolePlay',
        prompt: `Scenario: ${scenario.name}. Transcript: ${transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}`
      });
      const analysis = JSON.parse(data || '{}');
      const finalFeedback = { 
        ...analysis, 
        timestamp: new Date().toLocaleString(), 
        center: currentCenter || '不明', 
        scenarioName: scenario.name, 
        traineeName, 
        fullTranscript: transcript, 
        persona 
      };
      // FIX: saveRolePlayLog only takes 1 argument in apiClient
      apiClient.saveRolePlayLog(finalFeedback).catch(console.error);
      return finalFeedback;
    } catch (e) {
      alert("評価に失敗しました。");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { handleLogout, handleAdminLogin, handleCompleteRolePlay, isAnalyzing };
};
