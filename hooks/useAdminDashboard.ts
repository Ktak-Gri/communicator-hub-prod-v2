import { useState } from 'react';
import { requestWithJsonp } from '../api.ts';
import { Scenario, TestQuestion } from '../types.ts';

export const useAdminDashboard = (adminToken: string | null) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'tests' | 'masters' | 'simulator' | 'logs' | 'maintenance'>('scenarios');
  const [isSaving, setIsSaving] = useState(false);

  const generateNewId = (prefix: string, items: any[]) => {
    const ids = items.map(item => {
        const idStr = String(item.id || item.ID || "").trim();
        const match = idStr.match(new RegExp(`${prefix}-(\\d+)`));
        return match ? parseInt(match[1], 10) : -1;
    });
    const max = Math.max(...ids, -1);
    return `${prefix}-${max + 1}`;
  };

  /**
   * Helper to update the spreadsheet sheet with the full items list.
   */
  const updateSheetWithItems = async (sheetName: string, items: any[], headers: string[]) => {
    const tableData = [headers];
    
    // Header mappings for serialization to Spreadsheet
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
        "スマホプラン": "smartphonePlan",
        "光プラン": "lightPlan",
        "問題文": "questionText",
        "解答": "answerText",
        "難易度": "difficulty"
    };

    const currentMap = sheetName === 'シナリオ' ? scenarioMap : testMap;

    items.forEach(item => {
      const row = headers.map(h => {
        const key = currentMap[h] || h;
        // どちらの形式（正規化済み/未正規化）でも値を取得できるようにする
        const val = item[key] ?? (item as any)[h];
        return (val !== undefined && val !== null) ? val : "";
      });
      tableData.push(row);
    });
    await requestWithJsonp('updateSheet', { sheet: sheetName, data: tableData }, adminToken);
  };

  const saveScenario = async (data: any, scenarios: Scenario[]) => {
    setIsSaving(true);
    try {
      const nextScenarios = [...scenarios];
      const targetId = String(data.id || (data as any).ID || "").trim();
      const id = targetId || generateNewId('S', scenarios);
      const newScenario = { ...data, id };
      
      const index = nextScenarios.findIndex(s => {
          const sid = String(s.id || (s as any).ID || "").trim();
          return sid === id && id !== "";
      });

      if (index > -1) nextScenarios[index] = newScenario;
      else nextScenarios.push(newScenario);

      await updateSheetWithItems('シナリオ', nextScenarios, ["ID", "シナリオ名", "センター", "スマホプラン", "光プラン", "最初の問い合わせ内容", "難易度", "性質"]);
      return nextScenarios;
    } catch (e: any) {
      console.error(e);
      alert(`シナリオの保存に失敗しました: ${e.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const saveTest = async (data: any, testQuestions: TestQuestion[]) => {
    setIsSaving(true);
    try {
      const nextTests = [...testQuestions];
      const targetId = String(data.id || (data as any).ID || "").trim();
      const id = targetId || generateNewId('T', testQuestions);
      const newTest = { ...data, id };
      
      const index = nextTests.findIndex(t => {
          const qid = String(t.id || (t as any).ID || "").trim();
          return qid === id && id !== "";
      });

      if (index > -1) nextTests[index] = newTest;
      else nextTests.push(newTest);

      await updateSheetWithItems('テスト問題', nextTests, ["ID", "テスト名", "センター", "スマホプラン", "光プラン", "問題文", "解答", "難易度"]);
      return nextTests;
    } catch (e: any) {
      console.error(e);
      alert(`テスト問題の保存に失敗しました: ${e.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: string, items: any[], sheetName: string, headers: string[]) => {
    const cleanId = String(id || "").trim().toLowerCase();
    if (!cleanId || cleanId === "undefined" || cleanId === "null") {
        alert("削除対象のIDが特定できません。一覧を更新してやり直してください。");
        return null;
    }

    setIsSaving(true);
    try {
      const nextItems = items.filter(item => {
          const itemId = String(item.id || (item as any).ID || "").trim().toLowerCase();
          return itemId !== cleanId;
      });
      
      if (nextItems.length === items.length) {
          console.warn("Target item not found in local state, but proceeding with update.");
      }

      await updateSheetWithItems(sheetName, nextItems, headers);
      return nextItems;
    } catch (e: any) {
      console.error(e);
      alert(`削除に失敗しました: ${e.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    isSaving,
    saveScenario,
    saveTest,
    deleteItem
  };
};