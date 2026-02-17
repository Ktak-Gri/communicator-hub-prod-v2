import { useState } from 'react';
import { TestQuestion, TestResult } from '../types.ts';
import { apiClient } from '../apiClient.ts';

export const useTestSession = () => {
  const [state, setState] = useState<'selecting' | 'generating' | 'in_progress' | 'submitting' | 'completed'>('selecting');
  const [question, setQuestion] = useState<TestQuestion | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTest = async (center: string, topic: string, difficulty: string) => {
    setState('generating');
    setError(null);
    try {
      // FIX: Calling generateTestQuestion which is now defined in apiClient
      const generated = await apiClient.generateTestQuestion(center, topic, difficulty);
      setQuestion({ ...generated, id: `gen-${Date.now()}` });
      setState('in_progress');
    } catch (e: any) {
      setError(e.message);
      setState('selecting');
    }
  };

  const submitAnswer = async (answer: string) => {
    if (!question) return;
    setState('submitting');
    try {
      // FIX: Calling scoreTestAnswer which is now defined in apiClient
      const scoreData = await apiClient.scoreTestAnswer(question, answer);
      setResult({ ...scoreData, modelAnswer: question.answerText });
      setState('completed');
      // FIX: Passing single object argument to saveTestLog as per apiClient definition
      await apiClient.saveTestLog({ ...scoreData, questionId: question.id, userAnswer: answer });
    } catch (e: any) {
      setError(e.message);
      setState('in_progress');
    }
  };

  return { state, question, result, error, startTest, submitAnswer, reset: () => setState('selecting') };
};