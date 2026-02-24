import { useState, useCallback } from 'react';
import { apiClient } from '../apiClient.ts';

export const useAuth = () => {
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30分

  const [traineeName, setTraineeName] = useState(
    () => localStorage.getItem('traineeName')?.replace(/"/g, '') || ''
  );
  const [currentCenter, setCurrentCenter] = useState(
    () => localStorage.getItem('currentCenter')?.replace(/"/g, '') || null
  );
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem('adminToken')?.replace(/"/g, '') || null
  );

  // ① saveSession
  const saveSession = useCallback(() => {
    const now = Date.now();
    const session = {
      loginAt: now,
      lastActivityAt: now,
      expiresAt: now + SESSION_TIMEOUT,
    };
    localStorage.setItem('session', JSON.stringify(session));
  }, [SESSION_TIMEOUT]);

  // ② refreshActivity
  const refreshActivity = useCallback(() => {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);
    const now = Date.now();

    session.lastActivityAt = now;
    session.expiresAt = now + SESSION_TIMEOUT;

    localStorage.setItem('session', JSON.stringify(session));
  }, [SESSION_TIMEOUT]);

  // ③ logout
  const logout = useCallback(() => {
    localStorage.removeItem('traineeName');
    localStorage.removeItem('currentCenter');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('session');

    setTraineeName('');
    setCurrentCenter(null);
    setAdminToken(null);
  }, []);

  // ④ checkSession
const checkSession = useCallback(() => {
  const sessionStr = localStorage.getItem('session');
  if (!sessionStr) return;

  try {
    const session = JSON.parse(sessionStr);
    const now = Date.now();

    if (!session.expiresAt || now > session.expiresAt) {
      logout();
    }
  } catch {
    logout();
  }
}, [logout]);

  // ⑤ login
  const login = useCallback(
    async (name: string) => {
      const res = await apiClient.validateTrainee(name);
      if (res.data) {
        const finalName = res.data.研修生名 || res.data.traineeName || name;
        const center = res.data.センター || res.data.center || null;

        setTraineeName(finalName);
        setCurrentCenter(center);

        localStorage.setItem('traineeName', JSON.stringify(finalName));
        if (center)
          localStorage.setItem('currentCenter', JSON.stringify(center));

        saveSession(); // ✅ ここ重要

        return { success: true };
      }
      return { success: false, error: '未登録です' };
    },
    [saveSession]
  );

  // ⑥ adminLogin
  const adminLogin = useCallback(
    async (password: string) => {
      const res = await apiClient.adminLogin(password);
      if (res.data?.token) {
        setAdminToken(res.data.token);
        localStorage.setItem('adminToken', JSON.stringify(res.data.token));

        saveSession(); // ✅ ここ重要

        return { success: true };
      }
      return { success: false };
    },
    [saveSession]
  );

  return {
    traineeName,
    currentCenter,
    adminToken,
    login,
    adminLogin,
    logout,
    updateCenter: (centerAbbr: string) => {
      setCurrentCenter(centerAbbr);
      localStorage.setItem('currentCenter', JSON.stringify(centerAbbr));
    },
    setTraineeName,
    refreshActivity,
    checkSession,
  };
};
