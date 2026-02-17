
import { MasterSetting, Scenario } from './types.ts';

export const domainMaster = {
  getFuzzy: (obj: any, keys: string[]) => {
    if (!obj) return '';
    const norm = (s: string) => String(s || "").replace(/[\s　]/g, '').toLowerCase();
    const targetKeys = keys.map(norm);
    for (const k of Object.keys(obj)) {
        if (targetKeys.includes(norm(k))) return obj[k];
    }
    return '';
  },

  normalizeMasterSetting: (s: any): MasterSetting => ({
    name: domainMaster.getFuzzy(s, ["センター名", "名称", "name"]),
    abbreviation: domainMaster.getFuzzy(s, ["略称", "abbreviation", "abbr"]),
    displayFlag: String(domainMaster.getFuzzy(s, ["表示", "有効", "displayFlag"])).toLowerCase() === 'true',
    sortOrder: Number(domainMaster.getFuzzy(s, ["ソート順", "sortOrder"]) || 999),
    showInSummary: String(domainMaster.getFuzzy(s, ["概要表示", "showInSummary"])).toLowerCase() === 'true'
  }),

  // FIX: normalizeScenario must return a Scenario object with all required properties including internalId
  normalizeScenario: (s: any, idx: number): Scenario => {
    const id = domainMaster.getFuzzy(s, ["ID", "id"]) || `S-${idx}`;
    return {
      id,
      internalId: `S-${idx}-${id}`,
      name: domainMaster.getFuzzy(s, ["シナリオ名", "name"]),
      center: domainMaster.getFuzzy(s, ["センター", "center"]),
      smartphonePlan: domainMaster.getFuzzy(s, ["スマホプラン", "smartphonePlan"]),
      lightPlan: domainMaster.getFuzzy(s, ["光プラン", "lightPlan"]),
      initialInquiry: domainMaster.getFuzzy(s, ["最初の問い合わせ内容", "initialInquiry"]),
      difficulty: Number(domainMaster.getFuzzy(s, ["難易度", "difficulty"]) || 3),
      personality: domainMaster.getFuzzy(s, ["性質", "personality"])
    };
  }
};
