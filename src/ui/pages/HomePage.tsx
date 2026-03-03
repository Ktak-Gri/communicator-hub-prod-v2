import React from 'react';
import {
  HeadsetIcon,
  BookOpenIcon,
  HistoryIcon,
  PhoneIcon
} from "../components/icons/Icons";
import { ActivePage } from '../../types';

const NavCard = ({ title, description, icon, onClick, accent }: any) => {

  const colors: any = {
    sky: "text-sky-600 bg-sky-50 hover:border-sky-200",
    indigo: "text-indigo-600 bg-indigo-50 hover:border-indigo-200",
    amber: "text-amber-600 bg-amber-50 hover:border-amber-200",
    emerald: "text-emerald-600 bg-emerald-50 hover:border-emerald-200",
    slate: "text-slate-600 bg-slate-50 hover:border-slate-200",
    rose: "text-rose-600 bg-rose-50 hover:border-rose-200"
  };

  return (
    <div
      onClick={onClick}
      className={`group bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm transition-all cursor-pointer hover:-translate-y-1.5 hover:shadow-xl ${colors[accent]}`}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
        {icon}
      </div>

      <h3 className="text-xl font-black text-slate-800 mb-2">
        {title}
      </h3>

      <p className="text-slate-500 text-sm font-bold">
        {description}
      </p>
    </div>
  );
};

type Props = {
  navigate: (page: ActivePage) => void;
};

const HomePage: React.FC<Props> = ({ navigate }) => {

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-10">

      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black">
          研修メニュー
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <NavCard
          title="AIロープレ"
          description="AI対話訓練"
          icon={<HeadsetIcon />}
          accent="sky"
          onClick={() => navigate('roleplay')}
        />

        <NavCard
          title="1 on 1 通話"
          description="リアルタイム通話"
          icon={<PhoneIcon />}
          accent="indigo"
          onClick={() => navigate('oneonone')}
        />

        <NavCard
          title="知識テスト"
          description="学習モード"
          icon={<BookOpenIcon />}
          accent="amber"
          onClick={() => navigate('learning')}
        />

        <NavCard
          title="研修記録"
          description="履歴確認"
          icon={<HistoryIcon />}
          accent="emerald"
          onClick={() => navigate('history')}
        />

      </div>
    </div>
  );
};

export default HomePage;