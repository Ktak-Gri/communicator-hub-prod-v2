import React from "react";
import { ActivePage } from "../../types";

type Props = {
  navigate: (page: ActivePage) => void;
};

const OneOnOneHub: React.FC<Props> = ({ navigate }) => {

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h1 className="text-xl font-bold">
          1 on 1 通話Hub
        </h1>

        <button
          onClick={() => navigate("home")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← ホームへ戻る
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">

          <p className="text-lg text-gray-600">
            1on1通話待機中
          </p>

          <button className="px-6 py-3 bg-indigo-500 text-white rounded-lg">
            通話開始
          </button>

        </div>
      </div>

    </div>
  );
};

export default OneOnOneHub;