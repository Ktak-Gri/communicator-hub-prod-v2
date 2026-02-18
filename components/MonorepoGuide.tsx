import React, { useState } from 'react';
import { Cog6ToothIcon, ClipboardIcon, SparklesIcon, InformationCircleIcon, ArrowLeftIcon, LoadingIcon, CheckCircleIcon } from './Icons.tsx';
import { generateAiContentAsync } from '../api.ts';

const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label }) => (
    <div className="relative group mt-4">
        {label && <div className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{label}</div>}
        <pre className="bg-slate-900 text-emerald-400 p-5 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed border border-slate-800 shadow-2xl">
            {code}
        </pre>
        <button 
            onClick={() => { navigator.clipboard.writeText(code); alert('コピーしました'); }}
            className="absolute top-10 right-4 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 shadow-xl"
        >
            <ClipboardIcon className="h-4 w-4" />
            <span className="text-xs font-black uppercase">コピー</span>
        </button>
    </div>
);

const MonorepoGuide: React.FC<{ onBack: () => void; apiKey: string | null; adminToken: string | null }> = ({ onBack, apiKey, adminToken }) => {
    const [selectedTool, setSelectedTool] = useState<'pnpm' | 'nx' | 'turborepo'>('pnpm');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);

    const askGemini = async () => {
        setIsGenerating(true);
        try {
            const prompt = `あなたは世界最高峰のフロントエンドエンジニアです。モノレポ構成（特に ${selectedTool} を使用）のメリット、ディレクトリ構成のベストプラクティス、および初期設定コマンドを詳しく解説してください。レスポンスはMarkdown形式で、日本語でお願いします。`;
            // Fixed: Removed extra arguments
            const { data } = await generateAiContentAsync({ 
                prompt,
                systemInstruction: "あなたはシニアソフトウェアアーキテクトです。専門的かつ分かりやすい技術解説を提供してください。"
            });
            setAiAdvice(data);
        } catch (e) {
            alert('AIの呼び出しに失敗しました');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 text-left">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-sky-500 uppercase tracking-widest transition-all cursor-pointer group">
                    <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> ホームへ戻る
                </button>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    開発者モード
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-slate-700">
                <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-6 bg-white/5 rounded-3xl backdrop-blur-2xl border border-white/10 shadow-2xl">
                        <Cog6ToothIcon className="h-16 w-16 text-sky-400" />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-black tracking-tighter mb-2">Monorepo Architect Guide</h2>
                        <p className="text-slate-400 font-bold leading-relaxed max-w-xl">
                            複数のプロジェクトを一箇所で管理し、コードの再利用性とビルドスピードを劇的に向上させます。
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <span className="bg-sky-500 text-white p-1 rounded-lg"><InformationCircleIcon className="h-5 w-5" /></span>
                            構成ツールの選択
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: 'pnpm', name: 'pnpm Workspaces', desc: '標準的な依存関係管理' },
                                { id: 'turborepo', name: 'Turborepo', desc: 'ビルドキャッシュ・高速化' },
                                { id: 'nx', name: 'Nx', desc: 'フルスタック・大規模向け' }
                            ].map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool.id as any)}
                                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left group ${selectedTool === tool.id ? 'border-sky-500 bg-sky-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`font-black text-sm mb-1 ${selectedTool === tool.id ? 'text-sky-700' : 'text-slate-600'}`}>{tool.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{tool.desc}</div>
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={askGemini}
                            disabled={isGenerating}
                            className="w-full mt-6 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:bg-slate-300"
                        >
                            {isGenerating ? <LoadingIcon className="h-5 w-5" /> : <SparklesIcon className="h-5 w-5 text-sky-400" />}
                            <span>AIアーキテクトに聞く</span>
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {aiAdvice ? (
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl prose prose-slate max-w-none animate-fade-in">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">AI 推奨アーキテクチャ</span>
                            </div>
                            <div className="whitespace-pre-wrap text-slate-700 font-bold Kal Kal leading-relaxed">
                                {aiAdvice}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-sky-50 border-2 border-sky-100 p-8 rounded-[2.5rem]">
                                <h4 className="text-xl font-black text-sky-900 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
                                    Step 1: リポジトリの初期化
                                </h4>
                                <p className="text-sky-700 text-sm font-bold mb-4">
                                    pnpmを使用してワークスペースを作成します。ルートディレクトリに <code>pnpm-workspace.yaml</code> を作成してください。
                                </p>
                                <CodeBlock 
                                    label="pnpm-workspace.yaml"
                                    code={`packages:\n  - 'apps/*'\n  - 'packages/*'`} 
                                />
                            </div>

                            <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2.5rem]">
                                <h4 className="text-xl font-black text-emerald-900 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                    Step 2: Turborepo の導入
                                </h4>
                                <p className="text-emerald-700 text-sm font-bold mb-4">
                                    ビルドキャッシュを有効にするため、ルートに <code>turbo.json</code> を配置します。
                                </p>
                                <CodeBlock 
                                    label="turbo.json"
                                    code={`{\n  "$schema": "https://turbo.build/schema.json",\n  "pipeline": {\n    "build": {\n      "dependsOn": ["^build"],\n      "outputs": [".next/**", "dist/**"]\n    },\n    "lint": {},\n    "dev": {\n      "cache": false,\n      "persistent": true\n    }\n  }\n}`} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MonorepoGuide;