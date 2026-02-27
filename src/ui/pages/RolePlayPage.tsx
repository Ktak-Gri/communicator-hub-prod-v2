import React from "react";
import { ActivePage } from "../../types";

import RolePlaySessionContainer
  from "../components/session/RolePlaySessionContainer";

type Props = {
  navigate: (page: ActivePage) => void;
};

const RolePlayPage: React.FC<Props> = ({ navigate }) => {

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {/* =========================
          Header
      ========================== */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow">

        <h1 className="text-xl font-bold">
          AIロールプレイ
        </h1>

        <button
          onClick={() => navigate("home")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← ホームへ戻る
        </button>

      </div>

      {/* =========================
          Main Area
      ========================== */}
      <div className="flex-1 flex items-center justify-center">

        {/* ⭐ 音声制御はここに集約 */}
        <RolePlaySessionContainer />

      </div>

    </div>
  );
};

export default RolePlayPage;