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

import { MicLevelMeter } from "../components/audio/MicLevelMeter";

import { useRolePlaySession } from "../../hooks/useRolePlaySession";
import { useMicLevel } from "../../hooks/useMicLevel";
import { useVAD } from "../../hooks/useVAD";

interface RolePlayScreenProps {
  scenario: Scenario;
  traineeName: string;
  onBack: () => void;
  onComplete: (
    transcript: TranscriptItem[],
    scenario: Scenario,
    persona: any
  ) => void | Promise<void>;
  isAnalyzing: boolean;
}

const RolePlayPage: React.FC<RolePlayScreenProps> = ({
  scenario,
  traineeName,
  onBack,
  onComplete,
  isAnalyzing
}) => {

  const {
    messages,
    status,
    persona,
    startSession,
    setStatus
  } = useRolePlaySession(scenario, traineeName);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  /* ===============================
     通話状態抽象化
  =============================== */
  const isCallActive =
    status === "connected" ||
    status === "analyzing";

  /* ===============================
     Mic Level
  =============================== */
  const micLevel = useMicLevel(isCallActive);

  /* ===============================
     VAD
  =============================== */
  const { speaking } = useVAD(micLevel);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  return (
    <div className="flex flex-col h-[82vh] relative">

      {/* ===== VAD ===== */}
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        {speaking ? "🎤 Speaking" : "🤫 Silent"}
      </div>

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800">

        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white"
          >
            <ArrowLeftIcon />
            戻る
          </button>

          <h2 className="text-lg font-semibold text-white">
            {scenario.title}
          </h2>
        </div>

        {isCallActive && (
          <button
            onClick={async () => {
              setStatus("analyzing");

              try {
                await onComplete(
                  messages,
                  scenario,
                  persona
                );
              } catch (e) {
                console.error(e);
                setStatus("connected");
              }
            }}
            disabled={isAnalyzing}
            className="flex items-center gap-2 text-white"
          >
            {isAnalyzing
              ? <LoadingIcon />
              : <PhoneDownIcon />}
            終了・評価
          </button>
        )}
      </div>

      {/* ===== MIC ===== */}
      {isCallActive && (
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">

            <span className="text-emerald-400 text-sm">
              🎤 通話中
            </span>

            <div className="flex-1">
              <MicLevelMeter level={micLevel} />
            </div>

          </div>
        </div>
      )}

      {/* ===== BODY ===== */}
      <div className="flex-1 relative">

        {status === "ringing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <PhoneIcon />

            <button
              onClick={startSession}
              className="bg-emerald-500 text-white px-10 py-5 rounded-2xl"
            >
              📞 受電する
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <WifiOffIcon />
            <p>接続エラー</p>

            <button onClick={onBack}>
              メニューに戻る
            </button>
          </div>
        )}

        {isCallActive && (
          <div className="p-6 overflow-y-auto">

            {messages.map((msg, idx) => (
              <div key={idx} className="mb-4 text-white">
                <b>
                  {msg.speaker === "user"
                    ? traineeName
                    : "CUSTOMER"}
                </b>
                <div>{msg.text}</div>
              </div>
            ))}

            <div ref={transcriptEndRef} />

          </div>
        )}
      </div>
    </div>
  );
};

export default RolePlayPage;