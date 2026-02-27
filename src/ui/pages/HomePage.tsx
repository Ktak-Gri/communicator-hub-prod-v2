type Props = {
  navigate: (page: ActivePage) => void;
};

const HomePage: React.FC<Props> = ({ navigate }) => {
  return (
    <div className="max-w-6xl mx-auto py-10 space-y-10 animate-fade-in">

      <div className="text-center space-y-3">
        <div className="inline-block px-4 py-1 bg-slate-900 text-sky-400 text-[10px] font-black rounded-full tracking-[0.3em] uppercase">
          Professional Training Hub
        </div>

        <h2 className="text-4xl font-black text-slate-900">
          研修メニュー
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <NavCard
          title="AIロープレ"
          icon={<HeadsetIcon />}
          accent="sky"
          onClick={() => navigate("roleplay")}
        />

        <NavCard
          title="1 on 1 通話"
          icon={<PhoneIcon />}
          accent="indigo"
          onClick={() => navigate("oneonone")}
        />

        <NavCard
          title="知識テスト"
          icon={<BookOpenIcon />}
          accent="amber"
          onClick={() => navigate("learning")}
        />

        <NavCard
          title="研修記録"
          icon={<HistoryIcon />}
          accent="emerald"
          onClick={() => navigate("history")}
        />

      </div>
    </div>
  );
};

export default HomePage;