import React from "react";
import { Headphones, Phone, BookOpen, Activity, Mic, User } from "lucide-react";

const cards = [
  {
    title: "AIロープレ",
    desc: "Gemini Liveによる超低遅延対話。顧客感情をリアルに再現。",
    icon: <Headphones size={28} />,
    bg: "bg-blue-50"
  },
  {
    title: "1 on 1通話",
    desc: "研修生同士のリアルタイム対話をAIが分析。",
    icon: <Phone size={28} />,
    bg: "bg-indigo-50"
  },
  {
    title: "知識テスト",
    desc: "Google検索連動で常に最新知識を学習。",
    icon: <BookOpen size={28} />,
    bg: "bg-yellow-50"
  },
  {
    title: "研修記録",
    desc: "成長曲線を可視化。過去セッション参照可能。",
    icon: <Activity size={28} />,
    bg: "bg-green-50"
  },
  {
    title: "業務一覧",
    desc: "全センターの最新業務と対応範囲を確認。",
    icon: <Mic size={28} />,
    bg: "bg-gray-100"
  },
  {
    title: "個人設定",
    desc: "所属センターやAI挙動の最適化。",
    icon: <User size={28} />,
    bg: "bg-rose-50"
  }
];

export default function TrainingMenu() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-10">
      <div className="w-full max-w-5xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1 bg-black text-white text-xs rounded-full tracking-widest">
            PROFESSIONAL TRAINING HUB
          </div>
          <h1 className="text-3xl font-bold mt-4">
            研修メニュー
          </h1>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`rounded-2xl p-6 shadow-md hover:shadow-xl transition cursor-pointer ${card.bg}`}
            >
              <div className="mb-4 text-gray-700">
                {card.icon}
              </div>

              <h2 className="font-semibold text-lg mb-2">
                {card.title}
              </h2>

              <p className="text-sm text-gray-600 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}