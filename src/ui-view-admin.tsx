
import React, { useState } from 'react';
import { Button, Card, LoadingIcon } from './ui-shared.tsx';

export const AdminView = ({ auth, state }: any) => {
  const [tab, setTab] = useState('scenarios');
  return (
    <div className="max-w-7xl mx-auto py-8 animate-fade-in space-y-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-10">
                <div><h2 className="text-4xl font-black tracking-tighter">管理ダッシュボード</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">System Administrator Mode</p></div>
                <Button onClick={auth.logout} variant="secondary">管理者終了</Button>
            </div>
            <nav className="flex gap-4 border-b border-slate-100 mb-8 overflow-x-auto">
                {['scenarios', 'tests', 'masters', 'logs'].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-6 py-4 font-black text-sm transition-all border-b-4 ${tab === t ? 'border-sky-600 text-sky-700 bg-sky-50/30' : 'border-transparent text-slate-400'}`}>
                        {t === 'scenarios' ? 'シナリオ' : t === 'tests' ? 'テスト問題' : t === 'masters' ? 'マスタ' : '実施ログ'}
                    </button>
                ))}
            </nav>
            <div className="min-h-[400px]">
                {tab === 'scenarios' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2"><h3 className="text-xl font-black">AIロープレ・シナリオ管理</h3><Button className="py-2.5">新規作成</Button></div>
                        <div className="bg-slate-50 rounded-[2rem] p-8 text-center text-slate-300 italic font-black">シナリオエディタを読み込み中...</div>
                    </div>
                )}
                {/* 他のタブも同様に復元 */}
            </div>
        </div>
    </div>
  );
};
