
import { useState } from 'react';
import { requestWithJsonp } from '../api.ts';
import { Scenario, TestQuestion } from '../types.ts';

export const useAdminDashboard = (adminToken: string | null) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'tests' | 'masters' | 'simulator' | 'logs'>('scenarios');
  const [isSaving, setIsSaving] = useState(false);

  const updateSheetWithItems = async (sheetName: string, items: any[], headers: string[]) => {
    const tableData = [headers];
    const scenarioMap: Record<string, string> = {
        "ID": "id",
        "シナリオ名": "name",
        "センター": "center",
        "スマホプラン": "smartphonePlan",
        "光プラン": "lightPlan",
        "最初の問い合わせ内容": "initialInquiry",
        "難易度": "difficulty",
        "性質": "personality"
    };
    const testMap: Record<string, string> = {
        "ID": "id",
        "テスト名": "name",
        "センター": "center",
        "問題文": "questionText",
        "解答": "answerText",
        "難易度": "difficulty"
    };
    const currentMap = sheetName === 'シナリオ' ? scenarioMap : testMap;

    items.forEach(item => {
      const row = headers.map(h => {
        const key = currentMap[h] || h;
        const val = item[key];
        return (val !== undefined && val !== null) ? val : "";
      });
      tableData.push(row);
    });
    
    return await requestWithJsonp('updateSheet', { sheet: sheetName, data: tableData }, adminToken);
  };

  const saveScenario = async (data: any, scenarios: Scenario[]) => {
    setIsSaving(true);
    try {
      let nextScenarios = [...scenarios];
      const index = nextScenarios.findIndex(s => 
        (data.internalId && s.internalId === data.internalId) || 
        (data.id && s.id === data.id && s.id !== "")
      );

      if (index !== -1) {
        nextScenarios[index] = { ...nextScenarios[index], ...data };
      } else {
        const newItem = { ...data, internalId: `SVR-SCN-NEW-${Date.now()}` };
        nextScenarios.push(newItem);
      }

      await updateSheetWithItems('シナリオ', nextScenarios, ["ID", "シナリオ名", "センター", "スマホプラン", "光プラン", "最初の問い合わせ内容", "難易度", "性質"]);
      return nextScenarios;
    } catch (e: any) {
      alert(`保存に失敗しました: ${e.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const saveTest = async (data: any, testQuestions: TestQuestion[]) => {
    setIsSaving(true);
    try {
      let nextTests = [...testQuestions];
      const index = nextTests.findIndex(t => 
        (data.internalId && t.internalId === data.internalId) || 
        (data.id && t.id === data.id && t.id !== "")
      );

      if (index !== -1) {
        nextTests[index] = { ...nextTests[index], ...data };
      } else {
        const newItem = { ...data, internalId: `SVR-TST-NEW-${Date.now()}` };
        nextTests.push(newItem);
      }

      await updateSheetWithItems('テスト問題', nextTests, ["ID", "テスト名", "センター", "問題文", "解答", "難易度"]);
      return nextTests;
    } catch (e: any) {
      alert(`保存に失敗しました: ${e.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (targetId: string, items: any[], sheetName: string, headers: string[]) => {
    if (!targetId) return null;
    setIsSaving(true);
    try {
      const tid = String(targetId).trim();
      const nextItems = items.filter(item => {
          const iid = String(item.internalId || "").trim();
          const sid = String(item.id || "").trim();
          return iid !== tid && sid !== tid;
      });
      
      if (items.length === nextItems.length) {
          console.warn("削除対象がフィルタリングで見つかりませんでした。ID:", tid);
      }

      await updateSheetWithItems(sheetName, nextItems, headers);
      return nextItems;
    } catch (e: any) {
      alert(`削除に失敗しました: ${e.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return { activeTab, setActiveTab, isSaving, saveScenario, saveTest, deleteItem };
};
