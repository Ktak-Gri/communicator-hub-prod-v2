import { useState } from 'react';
import { apiClient } from '../apiClient.ts';
import { Scenario, TestQuestion } from '../types.ts';

/**
 * 黄金の正規化ロジック (V8.0.2)
 * 数値末尾の.0除去、全角半角変換、空白除去を徹底。
 */
const normalizeId = (id: any): string => {
    if (id === null || id === undefined) return "";
    let s = String(id).trim();
    if (!isNaN(id as any) && s.includes('.')) {
        s = s.replace(/\.0+$/, "");
    }
    s = s.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (m) => String.fromCharCode(m.charCodeAt(0) - 0xFEE0));
    return s.replace(/[\s　\t\n\r]/g, "").toLowerCase();
};

export const useAdminDashboard = (adminToken: string | null) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'tests' | 'masters' | 'simulator' | 'logs'>('scenarios');
  const [isSaving, setIsSaving] = useState(false);

  const saveScenario = async (data: any, scenarios: Scenario[]) => {
    setIsSaving(true);
    try {
      const targetId = normalizeId(data.id);
      let nextScenarios = [...scenarios];
      const index = nextScenarios.findIndex(s => normalizeId(s.id) === targetId);

      if (index !== -1) {
        nextScenarios[index] = { ...nextScenarios[index], ...data };
      } else {
        nextScenarios.push({ ...data });
      }

      const headers = ["ID", "シナリオ名", "センター", "スマホプラン", "光プラン", "最初の問い合わせ内容", "難易度", "性質"];
      const tableData = [headers];
      nextScenarios.forEach(s => {
          tableData.push([String(s.id), s.name, s.center, s.smartphonePlan, s.lightPlan, s.initialInquiry, String(s.difficulty), s.personality]);
      });

      await apiClient.updateSheet('シナリオ', tableData, adminToken);
      return nextScenarios;
    } catch (e: any) {
      alert(`保存失敗: ${e.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const saveTest = async (data: any, testQuestions: TestQuestion[]) => {
    setIsSaving(true);
    try {
      const targetId = normalizeId(data.id);
      let nextTests = [...testQuestions];
      const index = nextTests.findIndex(t => normalizeId(t.id) === targetId);

      if (index !== -1) {
        nextTests[index] = { ...nextTests[index], ...data };
      } else {
        nextTests.push({ ...data });
      }

      const headers = ["ID", "テスト名", "センター", "問題文", "解答", "難易度"];
      const tableData = [headers];
      nextTests.forEach(t => {
          tableData.push([String(t.id), t.name, t.center, t.questionText, t.answerText, String(t.difficulty)]);
      });

      await apiClient.updateSheet('テスト問題', tableData, adminToken);
      return nextTests;
    } catch (e: any) {
      alert(`保存失敗: ${e.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (rawId: string, items: any[], type: 'シナリオ' | 'テスト問題') => {
    const tid = normalizeId(rawId);
    if (!tid) {
        alert("エラー: 削除対象のIDが特定できません。一度「同期」を行って管理番号を確定させてください。");
        return null;
    }
    
    setIsSaving(true);
    try {
      console.info(`[Admin] Sending delete request for ${type} with ID: ${tid}`);
      if (type === 'シナリオ') {
        await apiClient.deleteScenario(tid, adminToken);
      } else {
        await apiClient.deleteTestQuestion(tid, adminToken);
      }

      // 正規化IDでフィルタリングすることで、Stateとシートの整合性を保証
      const nextItems = items.filter(item => normalizeId(item.id) !== tid);
      return nextItems;
    } catch (e: any) {
      console.error(`[Admin] Delete Failed ID: ${tid}`, e);
      throw new Error(e.message || "サーバー通信に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return { activeTab, setActiveTab, isSaving, saveScenario, saveTest, deleteItem };
};