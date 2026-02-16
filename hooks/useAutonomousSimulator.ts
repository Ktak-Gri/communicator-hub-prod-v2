
import { useState, useRef } from 'react';
import { Scenario, SimulationResult } from '../types.ts';
import { apiClient } from '../apiClient.ts';
import { generateAiContentAsync } from '../api.ts';

export const useAutonomousSimulator = (scenarios: Scenario[]) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [progress, setProgress] = useState(0);

  const run = async () => {
    setIsBusy(true);
    setResults([]);
    const targets = scenarios.filter(s => selectedIds.includes(s.id));
    
    for (let i = 0; i < targets.length; i++) {
      setProgress(Math.round(((i + 1) / targets.length) * 100));
      // シミュレーションロジック ( api.ts を直接呼ぶか、apiClientを拡張 )
      const result: SimulationResult = { 
        scenario: targets[i], 
        transcript: [{ speaker: 'AI Customer', text: "プラン変更したいです" }], 
        analysis: "良好な応対でした。" 
      };
      setResults(prev => [...prev, result]);
    }
    setIsBusy(false);
  };

  return { selectedIds, setSelectedIds, isBusy, results, progress, run };
};
