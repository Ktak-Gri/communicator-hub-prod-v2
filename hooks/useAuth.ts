
import { useState, useCallback } from 'react';
import { apiClient } from '../apiClient.ts';

export const useAuth = () => {
    const [traineeName, setTraineeName] = useState(() => localStorage.getItem('traineeName')?.replace(/"/g, '') || '');
    const [currentCenter, setCurrentCenter] = useState(() => localStorage.getItem('currentCenter')?.replace(/"/g, '') || null);
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken')?.replace(/"/g, '') || null);

    const login = useCallback(async (name: string) => {
        const res = await apiClient.validateTrainee(name);
        if (res.data) {
            const finalName = res.data.研修生名 || res.data.traineeName || name;
            const center = res.data.センター || res.data.center || null;
            setTraineeName(finalName);
            setCurrentCenter(center);
            localStorage.setItem('traineeName', JSON.stringify(finalName));
            if (center) localStorage.setItem('currentCenter', JSON.stringify(center));
            return { success: true };
        }
        return { success: false, error: '未登録です' };
    }, []);

    const adminLogin = useCallback(async (password: string) => {
        const res = await apiClient.adminLogin(password);
        if (res.data?.token) {
            setAdminToken(res.data.token);
            localStorage.setItem('adminToken', JSON.stringify(res.data.token));
            return { success: true };
        }
        return { success: false };
    }, []);

    const updateCenter = useCallback((centerAbbr: string) => {
        setCurrentCenter(centerAbbr);
        localStorage.setItem('currentCenter', JSON.stringify(centerAbbr));
    }, []);

    const logout = useCallback(() => {
        localStorage.clear();
        setTraineeName('');
        setCurrentCenter(null);
        setAdminToken(null);
    }, []);

    return { traineeName, currentCenter, adminToken, login, adminLogin, logout, updateCenter, setTraineeName };
};
