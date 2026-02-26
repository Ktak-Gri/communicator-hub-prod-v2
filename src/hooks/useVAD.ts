import { useEffect, useRef, useState } from 'react';

export const useVAD = (
  level: number,
  threshold = 0.05,
  silenceDelay = 500
) => {

  const [speaking, setSpeaking] = useState(false);
  const lastSpeechTimeRef = useRef(0);

  useEffect(() => {

    const now = performance.now();

    if (level > threshold) {
      lastSpeechTimeRef.current = now;
      setSpeaking(true);
      return;
    }

    if (now - lastSpeechTimeRef.current > silenceDelay) {
      setSpeaking(false);
    }

  }, [level, threshold, silenceDelay]);

  return { speaking };
};