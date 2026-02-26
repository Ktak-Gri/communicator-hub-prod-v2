import { useEffect, useRef, useState } from 'react';

export const useMicLevel = (active: boolean) => {

  const [level, setLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!active) return;

    let stream: MediaStream;

    const init = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 512;

      const source =
        audioContext.createMediaStreamSource(stream);

      source.connect(analyser);

      const data =
        new Uint8Array(analyser.frequencyBinCount);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const detect = () => {

        analyser.getByteTimeDomainData(data);

        let sum = 0;

        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }

        const rms = Math.sqrt(sum / data.length);

        setLevel(rms);

        rafRef.current =
          requestAnimationFrame(detect);
      };

      detect();
    };

    init();

    return () => {
      if (rafRef.current)
        cancelAnimationFrame(rafRef.current);

      audioContextRef.current?.close();
    };

  }, [active]);

  return level;
};