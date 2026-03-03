import { useEffect, useRef, useState } from "react";

type Options = {
  enabled: boolean;
};

export const useMicLevel = ({ enabled }: Options) => {

  const [level, setLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {

    if (!enabled) {
      setLevel(0);
      return;
    }

    let stream: MediaStream;

    const init = async () => {

      try {

        stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 256;

        const source =
          audioContext.createMediaStreamSource(stream);

        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        const update = () => {

          analyser.getByteTimeDomainData(dataArray);

          let sum = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
          }

          const rms = Math.sqrt(sum / bufferLength);

          setLevel(Math.min(100, rms * 200));

          animationRef.current =
            requestAnimationFrame(update);
        };

        update();

      } catch (err) {
        console.error("Mic access error:", err);
      }
    };

    init();

    return () => {

      if (animationRef.current)
        cancelAnimationFrame(animationRef.current);

      audioContextRef.current?.close();

      stream?.getTracks().forEach(t => t.stop());
    };

  }, [enabled]);

  return { level };
};