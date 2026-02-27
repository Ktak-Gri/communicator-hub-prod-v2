import React, { useState, useRef } from "react";

import { useRolePlaySession } from "../../../hooks/useRolePlaySession";
import { useMicLevel } from "../../../hooks/useMicLevel";
import { useVAD } from "../../../hooks/useVAD";

import { SessionState } from "../../../types/session-state";

const RolePlaySessionContainer: React.FC = () => {

  const [started, setStarted] = useState(false);
  const [state, setState] =
    useState<SessionState>("idle");

  const connectedRef = useRef(false);

  /* =====================
     AI SESSION
  ===================== */

  useRolePlaySession({
    enabled: started && !connectedRef.current,

    onConnecting: () =>
      setState("connecting"),

    onConnected: () => {
      connectedRef.current = true;
      setState("listening");
    },

    onAIThinking: () =>
      setState("thinking"),

    onAISpeaking: () =>
      setState("speaking"),

    onIdle: () =>
      setState("listening")
  });

  /* =====================
     MIC
  ===================== */

  const mic = useMicLevel({
    enabled: started
  });

  /* =====================
     VAD
  ===================== */

  useVAD({
    enabled: started,
    onSpeechStart: () =>
      setState("listening")
  });

  /* =====================
     UI
  ===================== */

  return (
    <div className="space-y-6 text-center">

      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg"
        >
          セッション開始
        </button>
      ) : (
        <>
          <div className="text-xl font-bold">
            {state === "connecting" && "🔄 接続中"}
            {state === "listening" && "🎤 聞いています"}
            {state === "thinking" && "🤖 AI思考中"}
            {state === "speaking" && "🗣 AI応答中"}
          </div>

          <div>
            Mic Level : {mic.level}
          </div>
        </>
      )}

    </div>
  );
};

export default RolePlaySessionContainer;