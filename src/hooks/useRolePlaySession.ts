import { useEffect, useRef, useState } from "react";
import { useMicLevel } from "./useMicLevel";

export const useRolePlaySession = () => {

  const [status, setStatus] = useState("Idle");
  const [started, setStarted] = useState(false);

  const speakingRef = useRef(false);
  const silenceTimeRef = useRef<number>(0);

  const mic = useMicLevel({
    enabled: started
  });

  /**
   * ===============================
   * STABLE VAD LOOP
   * ===============================
   */
  useEffect(() => {

    if (!started) return;

    const THRESHOLD = 5;
    const SILENCE_DELAY = 800;

    const id = setInterval(() => {

      const level = mic.level ?? 0;
      const now = Date.now();

      if (level > THRESHOLD) {

        silenceTimeRef.current = now;

        if (!speakingRef.current) {
          speakingRef.current = true;
          setStatus("Listening");
        }

      } else {

        if (
          speakingRef.current &&
          now - silenceTimeRef.current > SILENCE_DELAY
        ) {
          speakingRef.current = false;
          setStatus("Idle");
        }
      }

    }, 120); // ★ 安定監視周期

    return () => clearInterval(id);

  }, [started, mic]);

  /**
   * START
   */
  const onStart = async () => {

    if (started) return;

    setStatus("Connecting");

    await new Promise(r => setTimeout(r, 300));

    setStarted(true);
    setStatus("Idle");
  };

  /**
   * STOP
   */
  const onStop = () => {
    setStarted(false);
    setStatus("Stopped");
  };

  return {
    micLevel: mic.level ?? 0,
    status,
    onStart,
    onStop
  };
};