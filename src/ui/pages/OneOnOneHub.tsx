import React,
{
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from "react";

import {
  Trainee,
  Scenario,
  OneOnOneSession,
  TranscriptItem,
  Center
} from "../../types";

import { requestWithJsonp }
  from "../../api/api";

import {
  PhoneDownIcon,
  LoadingIcon,
  UserCircleIcon,
  ArrowLeftIcon
} from "../components/icons/Icons";

import { useRolePlaySession }
  from "../../hooks/useRolePlaySession";

interface OneOnOneHubProps {
  traineeName: string;
  trainees: Trainee[];
  currentCenter: Center | null;
  onComplete: (
    transcript: TranscriptItem[],
    scenario: Scenario,
    persona: any
  ) => void;
  isAnalyzing: boolean;
  onBack: () => void;
}

const OneOnOneHub: React.FC<OneOnOneHubProps> = ({
  traineeName,
  trainees,
  onComplete,
  isAnalyzing,
  onBack
}) => {

  /* =============================
     RolePlay Hook（接続封印管理）
  ============================= */
  const rolePlay = useRolePlaySession();

  const [session, setSession]
    = useState<OneOnOneSession | null>(null);

  const [selectedTrainee, setSelectedTrainee]
    = useState<string>("");

  const [practiceTopic, setPracticeTopic]
    = useState<string>("");

  const [isCalling, setIsCalling]
    = useState(false);

  const recognitionRef = useRef<any>(null);

  /* =============================
     有効研修生抽出
  ============================= */
  const activeTrainees = useMemo(() => {

    const now = new Date();
    const today =
      new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const myName =
      (traineeName || "").trim().toLowerCase();

    return trainees
      .filter(t => {

        const raw: any = t;

        const name =
          String(raw.traineeName || raw.研修生名 || "")
            .trim();

        if (!name) return false;
        if (name.toLowerCase() === myName) return false;

        const endDateRaw =
          t.endDate || raw.研修終了日;

        if (endDateRaw) {
          const end = new Date(endDateRaw);

          if (!isNaN(end.getTime())) {
            const endOnly =
              new Date(
                end.getFullYear(),
                end.getMonth(),
                end.getDate()
              );

            if (endOnly < today) return false;
          }
        }

        return true;
      })
      .map(t => {

        const raw: any = t;

        return {
          name:
            String(raw.traineeName || raw.研修生名 || ""),
          center:
            String(raw.center || raw.センター || "未所属")
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, "ja")
      );

  }, [trainees, traineeName]);

  /* =============================
     Polling
  ============================= */
  const poll = useCallback(async () => {
    try {
      const res =
        await requestWithJsonp("pollCall", {
          traineeName
        });

      if (res.data) setSession(res.data);
      else setSession(null);

    } catch {}
  }, [traineeName]);

  useEffect(() => {
    const timer =
      window.setInterval(poll, 3000);

    return () => clearInterval(timer);
  }, [poll]);

  /* =============================
     Call Start
  ============================= */
  const handleCall = async () => {

    if (!selectedTrainee) return;

    setIsCalling(true);

    await requestWithJsonp(
      "initiateCall",
      {
        caller: traineeName,
        receiver: selectedTrainee,
        scenarioId:
          `TOPIC:${practiceTopic || "総合対話練習"}`
      }
    );

    setIsCalling(false);
  };

  /* =============================
     Active Session UI
  ============================= */
  if (session) {
    return (
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white max-w-[360px] mx-auto text-center space-y-8">

        <UserCircleIcon
          className="w-20 h-20 text-sky-400 mx-auto animate-pulse"
        />

        <h2 className="text-xl font-black">
          {
            session.caller === traineeName
              ? session.receiver
              : session.caller
          }
          さんと接続中
        </h2>

        <button
          onClick={async () => {
            await requestWithJsonp(
              "endCall",
              { sessionId: session.sessionId }
            );
            setSession(null);
          }}
          className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto"
        >
          <PhoneDownIcon className="w-8 h-8" />
        </button>

      </div>
    );
  }

  /* =============================
     Main UI
  ============================= */
  return (
    <div className="max-w-2xl mx-auto">

      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon />
          戻る
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl p-10 space-y-6">

        <h2 className="text-2xl font-black">
          1 on 1 通話
        </h2>

        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">

          {activeTrainees.length > 0
            ? activeTrainees.map(t => (
              <button
                key={t.name}
                onClick={() =>
                  setSelectedTrainee(t.name)
                }
                className="p-3 rounded-xl border"
              >
                {t.name} ({t.center})
              </button>
            ))
            : (
              <div className="col-span-2 text-center">
                呼び出し可能な研修生はいません
              </div>
            )}

        </div>

        <input
          type="text"
          value={practiceTopic}
          onChange={e =>
            setPracticeTopic(e.target.value)
          }
          placeholder="練習テーマ"
          className="w-full p-4 bg-slate-50 rounded-xl"
        />

        <button
          onClick={handleCall}
          disabled={!selectedTrainee || isCalling}
          className="w-full bg-sky-600 text-white py-4 rounded-xl"
        >
          {isCalling
            ? <LoadingIcon />
            : "呼出を開始する"}
        </button>

      </div>
    </div>
  );
};

export default OneOnOneHub;