
import { useState, useCallback } from 'react';
import { apiClient } from './apiClient.ts';

export const useAuth = () => {
  const [traineeName, setTraineeName] = useState(() => localStorage.getItem('traineeName')?.replace(/"/g, '') || '');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken')?.replace(/"/g, '') || null);

  const login = useCallback(async (name: string) => {
    try {
      const res = await apiClient.validateTrainee(name);
      if (res.data) {
        const finalName = res.data.研修生名 || res.data.traineeName || name;
        setTraineeName(finalName);
        localStorage.setItem('traineeName', JSON.stringify(finalName));
        return { success: true, center: res.data.センター || res.data.center };
      }
      return { success: false, error: '未登録のユーザーです' };
    } catch (e) { return { success: false, error: '通信エラー' }; }
  }, []);

  const adminLogin = useCallback(async (password: string) => {
    try {
      const res = await apiClient.adminLogin(password);
      if (res.data?.token) {
        setAdminToken(res.data.token);
        localStorage.setItem('adminToken', JSON.stringify(res.data.token));
        return { success: true };
      }
      return { success: false };
    } catch (e) { return { success: false }; }
  }, []);

  const logout = useCallback(() => {
    setTraineeName('');
    setAdminToken(null);
    localStorage.clear();
  }, []);

  return { traineeName, setTraineeName, adminToken, setAdminToken, login, adminLogin, logout };
};
