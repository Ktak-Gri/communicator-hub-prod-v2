import React from "react";

type Props = {
  level: number;
};

export const MicLevelMeter: React.FC<Props> = ({ level }) => {
  return (
    <div
      style={{
        width: "300px",
        height: "16px",
        background: "#e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(level * 100, 100)}%`,
          height: "100%",
          background: "#22c55e",
          transition: "width 0.1s linear",
        }}
      />
    </div>
  );
};