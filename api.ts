import { apiClient } from './apiClient.ts';

// backward compatibility for components using api.ts
// Fix: Map to generic requestWithJsonp instead of specific updateSheet to support all GAS actions
export const requestWithJsonp = apiClient.requestWithJsonp;
export const getEffectiveUrl = () => sessionStorage.getItem('GAS_URL_OVERRIDE') || "";
export const setSessionUrlOverride = (url: string | null) => {
    if (url) sessionStorage.setItem('GAS_URL_OVERRIDE', url);
    else sessionStorage.removeItem('GAS_URL_OVERRIDE');
};

export async function generateAiContentAsync(params: any) {
    // Unify with apiClient
    const schema = params.schemaName || null;
    const prompt = params.prompt || "";
    const system = params.systemInstruction || "";
    const data = await apiClient.generateAiContent(schema, prompt, system);
    return { data: JSON.stringify(data) };
}

export const sanitizeErrorMessage = (e: any) => e?.message || String(e);