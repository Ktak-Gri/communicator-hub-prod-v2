import { useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  level?: number;
  threshold?: number;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
};

export const useVAD = ({
  enabled,
  level = 0,
  threshold = 8,
  onSpeechStart,
  onSpeechEnd
}: Options) => {

  const speakingRef = useRef(false);
  const silenceTimer = useRef<number>();

  useEffect(() => {

    if (!enabled) return;

    if (level > threshold) {

      if (!speakingRef.current) {
        speakingRef.current = true;
        onSpeechStart?.();
      }

      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }

      silenceTimer.current = window.setTimeout(() => {
        speakingRef.current = false;
        onSpeechEnd?.();
      }, 600);
    }

  }, [level, enabled]);
};