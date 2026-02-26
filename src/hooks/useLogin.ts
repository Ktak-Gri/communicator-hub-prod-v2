
import { useState, useCallback } from 'react';
import { apiClient } from '../apiClient.ts';

interface UseLoginProps {
  onLoginSuccess: (name: string, center: string) => void;
}

export const useLogin = ({ onLoginSuccess }: UseLoginProps) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = useCallback((val: string) => {
    setName(val);
    setError(null);
  }, []);

  const login = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.validateTrainee(trimmedName);
      if (data && (data.traineeName || data.研修生名 || data.trainee || data.研修生)) {
        const finalName = data.traineeName || data.研修生名 || data.trainee || data.研修生;
        const finalCenter = data.center || data.センター || '';
        onLoginSuccess(finalName, finalCenter);
      } else {
        setError(`「${trimmedName}」は未登録です。`);
      }
    } catch (err: any) {
      setError("接続失敗。設定を確認してください。");
    } finally {
      setIsLoading(false);
    }
  }, [name, onLoginSuccess]);

  return {
    name,
    isLoading,
    error,
    handleNameChange,
    login
  };
};
