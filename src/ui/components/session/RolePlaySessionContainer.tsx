import React, { useState } from "react";
import { TrainingPage } from "../../../app/TrainingPage";

const RolePlaySessionContainer: React.FC = () => {

  const [started, setStarted] = useState(false);

  if (started) {
    return <TrainingPage />;
  }

  return (
    <div className="text-center">
      <button
        onClick={() => setStarted(true)}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg"
      >
        セッション開始
      </button>
    </div>
  );
};

export default RolePlaySessionContainer;