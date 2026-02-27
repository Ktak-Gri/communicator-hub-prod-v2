import React from "react";

type MicLevelMeterProps = {
  level: number; // 0〜1 想定
};

export const MicLevelMeter: React.FC<MicLevelMeterProps> = ({ level }) => {

  // 安全クランプ（暴走防止）
  const safeLevel = Math.max(0, Math.min(level, 1));

  return (
    <div
      style={{
        width: "100%",
        height: "14px",
        backgroundColor: "#1f2937",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          width: `${safeLevel * 100}%`,
          height: "100%",
          background: "linear-gradient(90deg,#22c55e,#4ade80)",
          transition: "width 0.08s linear"
        }}
      />
    </div>
  );
};