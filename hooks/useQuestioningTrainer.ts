import { useState } from 'react';
import { apiClient } from '../apiClient.ts';
import { TranscriptItem } from '../types.ts';

export const useQuestioningTrainer = () => {
  const [status, setStatus] = useState<'idle' | 'active' | 'analyzing'>('idle');
  const [messages, setMessages] = useState<TranscriptItem[]>([]);
  const [topic, setTopic] = useState('');

  const startTraining = async () => {
    setStatus('analyzing');
    // FIX: Calling generateQuestioningScenario which is now defined in apiClient
    const scenario = await apiClient.generateQuestioningScenario();
    setTopic(scenario.topic);
    // FIX: Using 'model' role for AI parts for better compatibility with history schemas
    setMessages([{ speaker: 'model', text: scenario.initialInquiry }]);
    setStatus('active');
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { speaker: 'user', text }]);
    // FIX: Calling analyzeQuestionType which is now defined in apiClient
    await apiClient.analyzeQuestionType(text);
    // AI応答ロジック (簡略化) - Use model role for consistency
    setMessages(prev => [...prev, { speaker: 'model', text: "詳しく教えていただけますか？" }]);
  };

  return { status, messages, topic, startTraining, sendMessage };
};