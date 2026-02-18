
import { MasterSetting, Scenario, TestQuestion, Trainee } from '../types.ts';

/**
 * スプレッドシートの行オブジェクトから特定のキーを取得する
 */
const getValueByPriority = (obj: any, keys: string[], defaultIndex: number = -1) => {
    if (!obj) return '';
    
    // 1. 指定された候補キー（日本語ヘッダー名など）で検索
    const objKeys = Object.keys(obj);
    const norm = (s: string) => String(s || "").replace(/[\s　]/g, '').toLowerCase();
    const targetKeys = keys.map(norm);
    
    for (const originalKey of objKeys) {
        if (targetKeys.includes(norm(originalKey))) {
            const val = obj[originalKey];
            return (val === null || val === undefined) ? '' : String(val).trim();
        }
    }
    
    // 2. 候補が見つからない場合のみインデックス参照
    if (defaultIndex >= 0) {
        const firstKey = objKeys[defaultIndex];
        if (firstKey) {
            const val = obj[firstKey];
            return (val === null || val === undefined) ? '' : String(val).trim();
        }
    }

    return '';
};

export const dataConverter = {
    toMasterSetting: (s: any): MasterSetting => ({
        name: getValueByPriority(s, ["センター名", "名称", "name"], 0),
        abbreviation: getValueByPriority(s, ["略称", "センター略称", "abbreviation"], 1),
        displayFlag: String(getValueByPriority(s, ["表示", "有効", "displayFlag"], 2)).toLowerCase() === 'true',
        sortOrder: Number(getValueByPriority(s, ["ソート順", "sortOrder"], 3) || 999),
        showInSummary: String(getValueByPriority(s, ["概要表示", "showInSummary"], 4)).toLowerCase() === 'true'
    }),

    toScenario: (s: any, idx: number): Scenario => {
        // A列を強制的にIDとして扱う (V8.1.0)
        const sheetId = s.id || s.ID || getValueByPriority(s, ["ID", "管理番号", "管理ID", "識別番号"], 0);
        return {
            id: sheetId,
            internalId: sheetId || `row-${idx}`,
            name: getValueByPriority(s, ["シナリオ名", "名称", "name", "タイトル"], 1),
            center: getValueByPriority(s, ["センター", "所属", "center"], 2),
            smartphonePlan: getValueByPriority(s, ["スマホプラン", "スマホ"], 3),
            lightPlan: getValueByPriority(s, ["光プラン", "光"], 4),
            initialInquiry: getValueByPriority(s, ["最初の問い合わせ内容", "問い合わせ内容", "内容"], 5),
            difficulty: Number(getValueByPriority(s, ["難易度", "レベル"], 6) || 3),
            personality: getValueByPriority(s, ["性質", "性格", "ペルソナ"], 7)
        };
    },

    toTestQuestion: (q: any, idx: number): TestQuestion => {
        const sheetId = q.id || q.ID || getValueByPriority(q, ["ID", "管理番号", "管理ID", "識別番号"], 0);
        return {
            id: sheetId,
            internalId: sheetId || `row-${idx}`,
            name: getValueByPriority(q, ["テスト名", "問題タイトル", "タイトル"], 1),
            center: getValueByPriority(q, ["センター", "所属", "center"], 2),
            questionText: getValueByPriority(q, ["問題文", "内容"], 3),
            answerText: getValueByPriority(q, ["解答", "回答", "正解"], 4),
            difficulty: Number(getValueByPriority(q, ["難易度", "レベル"], 5) || 3)
        };
    },

    toTrainee: (t: any): Trainee => ({
        traineeName: getValueByPriority(t, ["研修生名", "氏名", "名前", "traineeName"], 0),
        center: getValueByPriority(t, ["センター", "所属", "center"], 1),
        endDate: getValueByPriority(t, ["研修終了日", "終了日", "endDate"], 2)
    })
};
