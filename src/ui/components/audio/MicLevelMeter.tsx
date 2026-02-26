import React, { useEffect, useRef } from "react";

import {
  Scenario,
  TranscriptItem
} from "../../types";

import {
  ArrowLeftIcon,
  LoadingIcon,
  PhoneDownIcon,
  PhoneIcon,
  WifiOffIcon
} from "../components/icons/Icons";

import { MicLevelMeter }
  from "../components/audio/MicLevelMeter";

import { useRolePlaySession }
  from "../../hooks/useRolePlaySession";

import { useMicLevel }
  from "../../hooks/useMicLevel";

import { useVAD }
  from "../../hooks/useVAD";

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