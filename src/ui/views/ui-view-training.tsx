import React from "react";

type TrainingViewProps = {
  micLevel: number;
  status: string;
  onStart: () => void;
  onStop: () => void;
};

export const TrainingView = ({
  micLevel,
  status,
  onStart,
  onStop,
}: TrainingViewProps) => {

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Training View</h2>

      {/* 状態表示 */}
      <p>Status: {status}</p>

      {/* マイクレベル */}
      <div
        style={{
          width: "300px",
          height: "20px",
          background: "#ddd",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            width: `${micLevel}%`,
            height: "100%",
            background: "green",
          }}
        />
      </div>

      {/* 操作ボタン */}
      <button onClick={onStart} style={{ marginRight: "10px" }}>
        Start
      </button>

      <button onClick={onStop}>
        Stop
      </button>
    </div>
  );
};