
import React from 'react';
import { domainMaster } from './domain-master.ts';
import { Button } from './ui-shared.tsx';

const FULL_CENTER_DATA = [
    { group: '総合', name: '総合インフォメーションセンター', abbr: '総合インフォ', details: '現行プラン(MAX, ポイ活, mini)への変更、住所変更、料金確認等全般' },
    { group: '専門', name: 'dカードセンター', abbr: 'dカード', details: '暗証番号ロック解除、d回線紐づけ、住所変更、明細確認等' },
    { group: '専門', name: 'アドバンスド・インフォメーションセンター', abbr: 'AIC', details: 'スマホ・タブレットの初期設定、基本操作案内(1次対応)' },
    { group: '専門', name: '遠隔サポートセンター', abbr: '遠サポ', details: 'リモート操作による設定サポート ※あんしん遠隔サポート加入者' },
    { group: '専門', name: 'ケータイ補償サービスセンター', abbr: '補償センター', details: '故障・水濡れ・紛失時の交換機お届け、補償受付(旧)' },
    { group: '専門', name: 'Smartあんしん補償センター', abbr: 'Smart補償', details: '故障・紛失・不正決済・携行品損害等の補償受付(現)' }
];

export const LearningView = ({ onBack }: any) => (
  <div className="max-w-4xl mx-auto py-10 space-y-6 animate-fade-in">
    <button onClick={onBack} className="text-xs font-black text-slate-400 hover:text-sky-600 transition-all uppercase tracking-widest">← 戻る</button>
    <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center space-y-6">
        <div className="text-5xl">✏️</div>
        <h2 className="text-3xl font-black">知識テスト</h2>
        <p className="text-slate-400 font-bold italic">AIがプラン知識を動的に出題・採点します (構築中)</p>
        <Button onClick={onBack}>戻る</Button>
    </div>
  </div>
);

export const SummaryView = ({ onBack }: any) => (
  <div className="max-w-7xl mx-auto py-8 animate-fade-in space-y-6 px-4">
    <button onClick={onBack} className="text-xs font-black text-slate-400 hover:text-sky-600 transition-all uppercase tracking-widest">← 戻る</button>
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl">
        <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center"><h2 className="text-xl font-black text-slate-800">業務範囲リファレンス</h2><span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">CONFIDENTIAL</span></div>
        <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#84b547] text-white font-black text-[10px] uppercase"><tr><th className="px-6 py-4">分類</th><th className="px-6 py-4">拠点名</th><th className="px-6 py-4">略称</th><th className="px-6 py-4">主な担当範囲</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {FULL_CENTER_DATA.map((c, i) => (
            <tr key={i} className={`${i % 2 === 0 ? 'bg-[#f7f9f5]' : 'bg-white'} hover:brightness-95 transition-all text-xs`}>
              <td className="px-6 py-5 font-black text-slate-400">{c.group}</td>
              <td className="px-6 py-5 font-black text-slate-800">{c.name}</td>
              <td className="px-6 py-5 font-mono font-black text-sky-600">{c.abbr}</td>
              <td className="px-6 py-5 text-slate-600 font-bold leading-relaxed">{c.details}</td>
            </tr>
          ))}
        </tbody></table></div>
    </div>
  </div>
);
