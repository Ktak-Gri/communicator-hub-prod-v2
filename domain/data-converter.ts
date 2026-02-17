
import { MasterSetting, Scenario, TestQuestion, Trainee } from '../types.ts';

const getFuzzy = (obj: any, keys: string[]) => {
    if (!obj) return '';
    const norm = (s: string) => String(s || "").replace(/[\s　]/g, '').toLowerCase();
    const targetKeys = keys.map(norm);
    const objKeys = Object.keys(obj);
    for (const k of objKeys) {
        if (targetKeys.includes(norm(k))) {
            const val = obj[k];
            return (val === null || val === undefined) ? '' : String(val).trim();
        }
    }
    return '';
};

export const dataConverter = {
    toMasterSetting: (s: any): MasterSetting => ({
        name: getFuzzy(s, ["センター名", "名称", "name"]),
        abbreviation: getFuzzy(s, ["略称", "センター略称", "abbreviation"]),
        displayFlag: String(getFuzzy(s, ["表示", "有効"])).toLowerCase() === 'true',
        sortOrder: Number(getFuzzy(s, ["ソート順", "sortOrder"]) || 999),
        showInSummary: String(getFuzzy(s, ["概要表示"])).toLowerCase() === 'true'
    }),

    toScenario: (s: any, idx: number): Scenario => {
        const sheetId = getFuzzy(s, ["ID", "id", "管理番号", "シナリオID"]);
        // 削除ロジックとの整合性をとるため SVR-SCN- を使用
        const internalId = `SVR-SCN-${sheetId || idx}`;
        
        return {
            id: sheetId,
            internalId: internalId,
            name: getFuzzy(s, ["シナリオ名", "名称", "name"]),
            center: getFuzzy(s, ["センター", "所属", "center"]),
            smartphonePlan: getFuzzy(s, ["スマホプラン"]),
            lightPlan: getFuzzy(s, ["光プラン"]),
            initialInquiry: getFuzzy(s, ["最初の問い合わせ内容", "問い合わせ内容"]),
            difficulty: Number(getFuzzy(s, ["難易度"]) || 3),
            personality: getFuzzy(s, ["性質", "性格"])
        };
    },

    toTestQuestion: (q: any, idx: number): TestQuestion => {
        const sheetId = getFuzzy(q, ["ID", "id", "管理番号", "テストID"]);
        const internalId = `SVR-TST-${sheetId || idx}`;

        return {
            id: sheetId,
            internalId: internalId,
            name: getFuzzy(q, ["テスト名", "問題タイトル", "テストタイトル"]),
            center: getFuzzy(q, ["センター", "所属", "center"]),
            questionText: getFuzzy(q, ["問題文"]),
            answerText: getFuzzy(q, ["解答", "回答"]),
            difficulty: Number(getFuzzy(q, ["難易度"]) || 3)
        };
    },

    toTrainee: (t: any): Trainee => ({
        traineeName: getFuzzy(t, ["研修生名", "氏名", "traineeName"]),
        center: getFuzzy(t, ["センター", "所属"]),
        endDate: getFuzzy(t, ["研修終了日", "endDate"])
    })
};
