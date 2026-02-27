
import React, { useMemo } from 'react';
import { CenterDetails, MasterSetting } from '../types.ts';
import { ArrowLeftIcon } from './Icons.tsx';

/**
 * 各センターの業務詳細定義 (V6.40.04: Precise Plan Matching)
 * 設問生成AIのコンテキストとしても利用される最重要データです
 */
export const FULL_CENTER_DATA: Omit<CenterDetails, 'bgColorClass'>[] = [
    {
        groupTitle: '総合',
        name: '総合インフォメーションセンター',
        abbr: '総合インフォ',
        sites: '北海道/東京/東海/関西/中国/九州',
        title: React.createElement('strong', { className: 'text-sky-700' }, 'ドコモサービスについての各種お問い合わせ/手続き/ドコモ MAX・ポイ活・mini等の現行プラン提案'),
        details: {
            col1: ['現行プラン（MAX/ポイ活MAX・20/mini）への変更相談', '支払方法の変更', '各種サービスのお問い合わせ'],
            col2: ['住所変更', 'ご契約内容の確認', '新規申し込み'],
            col3: ['盗難/紛失時の利用中断/再開', 'ご利用料金の確認'],
        },
    },
    {
        groupTitle: '専門センター',
        name: 'dカードセンター',
        abbr: 'dカード',
        title: React.createElement('strong', { className: 'text-sky-700' }, '「dカード」に関するお問合せ（ポイ活 MAX/20 等とのポイント連携含む）'),
        details: [
            '暗証番号入力誤りによるロック解除',
            'dアカウントとドコモ回線の紐づけ/解除',
            '住所変更に伴うカード不着の問い合わせ',
            'dカードの明細確認',
            'ランクダウン（ゴールド→一般）の受付',
        ],
    },
    {
        groupTitle: '専門センター',
        name: 'アドバンスド・インフォメーションセンター',
        abbr: 'AIC',
        title: React.createElement('strong', { className: 'text-sky-700' }, 'スマホ・タブレット・PC・ケータイの操作案内 (1次対応)'),
        details: ['・取扱説明書の動画内の操作案内', '・現行プラン（MAX/mini等）における初期設定サポート'],
    },
    {
        groupTitle: '専門センター',
        name: 'スマートフォン・ケアセンター',
        abbr: 'SPC',
        title: React.createElement('strong', { className: 'text-sky-700' }, 'スマホ・タブレット・PC・ケータイの操作案内 (2次対応)'),
        details: ['・AICで解決できなかった場合や問い合わせの2次対応窓口'],
    },
    {
        groupTitle: '専門センター',
        name: 'TI-光',
        abbr: 'TI光',
        title: React.createElement('strong', { className: 'text-sky-700' }, 'ドコモ光回線を使ったインターネット・環境についての操作案内'),
        details: ['・home5G、モバイルルーター、dフォト等のサービス案内'],
    },
    {
        groupTitle: '専門センター',
        name: '遠隔サポートセンター',
        abbr: '遠サポ',
        location: '代々木/池袋/横浜/多摩',
        title: React.createElement('strong', { className: 'text-sky-700' }, 'リモート操作による設定・操作・アプリの使い方のサポート'),
        details: [
            '「もっとアプリを使いたい」',
            '「画面の点灯時間を変えたい」',
            '「PCとの接続がわからない」',
        ],
        note: '※ あんしん遠隔サポート (440円/月) 加入者対象',
    },
    {
        groupTitle: '専門センター',
        name: 'ネットトータル・あんしん遠隔サポートセンター',
        abbr: 'ネットトータル',
        title: React.createElement('strong', { className: 'text-sky-700' }, 'インターネット接続機器・ソフトウェアに関するお問合せ'),
        details: [
            '接続設定、メール、セキュリティ設定',
            '光電話、周辺機器の設定',
            '訪問サポート、データ復旧、オンライン教室受付',
            '周辺機器の補償受付 ※ネットトータルサポート加入者対象',
        ],
    },
    {
        groupTitle: '専門センター',
        name: 'ケータイ補償サービスセンター',
        abbr: '補償センター',
        title: React.createElement('strong', { className: 'text-sky-700' }, '故障・水濡れ・盗難・紛失時のあらゆるトラブルをサポート'),
        details: [
            '交換電話機を当日～2日以内にお届け（年2回まで）',
            '月額：330円～1,000円（不課税）/ 負担金：5,000円～11,000円',
            '※2022年8月31日以前の発売機種が対象',
        ],
    },
    {
        groupTitle: '専門センター',
        name: 'Smartあんしん補償センター',
        abbr: 'Smart補償',
        title: React.createElement('strong', { className: 'text-sky-700' }, '最新のスマホまわりのトラブルを幅広くサポート'),
        details: [
            'イエナカ機器補償、スマホ不正決済補償、携行品補償',
            '月額：330円～1,000円（不課税）/ 負担金：5,000円～11,000円',
            '※2022年8月31日以降の発売機種が対象',
        ],
    },
    {
        groupTitle: '専門センター',
        name: '光IC',
        abbr: '光IC',
        title: React.createElement('strong', { className: 'text-sky-700' }, 'ドコモ光に関する各種サービスの注文手続き・お問い合せ'),
        details: ['・新規申し込み、解約、ISP変更'],
    },
    {
        groupTitle: '専門センター',
        name: 'OLCC',
        abbr: 'OLCC',
        title: React.createElement('strong', { className: 'text-sky-700' }, 'オンラインショップの注文サポート（電話・チャット）'),
        details: [
            '購入前・購入中・購入後の不明点サポート',
            '新規注文時の不備解消チャット',
            'ahamo・ポイ活プラン新規申込み時の不備解消対応等',
        ],
    },
];

interface CenterSummaryPageProps {
  masterSettings: MasterSetting[];
  onBack: () => void;
}

const CenterSummaryPage: React.FC<CenterSummaryPageProps> = ({ masterSettings, onBack }) => {
    const displayedRows = useMemo(() => {
        return FULL_CENTER_DATA;
    }, []);
    
    const darkColor = 'bg-[#eef4e8]';
    const lightColor = 'bg-[#f7f9f5]';

    const renderDetails = (details: any) => {
        if (Array.isArray(details)) {
            return (
                <ul className="list-disc list-inside space-y-0.5">
                    {details.map((item, index) => <li key={index} className="text-[11px] sm:text-xs leading-tight">{item}</li>)}
                </ul>
            );
        }
        if (details && 'col1' in details) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                    <ul className="list-disc list-inside space-y-0.5">{(details.col1).map((item, i) => <li key={i} className="text-[11px] sm:text-xs leading-tight">{item}</li>)}</ul>
                    <ul className="list-disc list-inside space-y-0.5">{(details.col2).map((item, i) => <li key={i} className="text-[11px] sm:text-xs leading-tight">{item}</li>)}</ul>
                    <ul className="list-disc list-inside space-y-0.5">{(details.col3).map((item, i) => <li key={i} className="text-[11px] sm:text-xs leading-tight">{item}</li>)}</ul>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            {/* 戻るボタン */}
            <div className="mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-sky-600 transition-all group px-2">
                    <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                    <span>ホームへ戻る</span>
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 leading-none">
                            <span className="w-1.5 h-5 bg-[#84b547] rounded-full"></span>
                            コールセンター業務一覧
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 ml-4 uppercase tracking-wider">Center Role & Scope Reference</p>
                    </div>
                    <div className="bg-rose-50 text-rose-600 text-[9px] font-black px-2 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">
                        CONFIDENTIAL
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse text-xs min-w-[950px]">
                        <thead className="bg-[#84b547] text-white font-black">
                            <tr>
                                <th className="px-3 py-3 border-r border-white/20 text-center w-28 whitespace-nowrap">分類</th>
                                <th className="px-3 py-3 border-r border-white/20 text-left w-60">センター名</th>
                                <th className="px-3 py-3 border-r border-white/20 text-center w-24">略称</th>
                                <th className="px-3 py-3 text-left">主な対応内容</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white">
                            {displayedRows.map((row, index) => {
                                const rowColor = index % 2 === 0 ? darkColor : lightColor;
                                return (
                                    <tr key={row.abbr} className={`${rowColor} hover:brightness-95 transition-all`}>
                                        <td className="px-3 py-3 border-r border-white text-center font-black text-slate-500 whitespace-nowrap align-middle">
                                            {row.groupTitle}
                                        </td>
                                        <td className="px-3 py-3 border-r border-white font-black text-slate-800 leading-tight align-middle">
                                            <div className="text-sm">{row.name}</div>
                                            {row.sites && <div className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">{row.sites}</div>}
                                            {row.location && <div className="text-[9px] text-slate-400 font-bold mt-0.5">{row.location}</div>}
                                        </td>
                                        <td className="px-3 py-3 border-r border-white text-center font-mono font-black text-slate-500 bg-black/5 align-middle">
                                            {row.abbr}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 leading-tight align-middle">
                                            <div className="mb-1.5 text-slate-900 border-b border-black/5 pb-1 font-bold">{row.title}</div>
                                            {renderDetails(row.details)}
                                            {row.note && <p className="mt-1.5 text-[10px] text-rose-600 font-black bg-rose-50/50 px-2 py-1 rounded border border-rose-100 inline-block">{row.note}</p>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[9px] text-slate-300 font-black text-right uppercase tracking-widest">
                    UT Group Co., Ltd. | Communicator Training Hub
                </div>
            </div>
        </div>
    );
};

export default CenterSummaryPage;
