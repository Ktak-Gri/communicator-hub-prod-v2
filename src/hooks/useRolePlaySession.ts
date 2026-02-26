import { useState, useRef } from "react";

export function useRolePlaySession() {

  const [status, setStatus] = useState("idle");
  const [micLevel, setMicLevel] = useState(0);

  const connectedRef = useRef(false);

  const start = async () => {
    if (connectedRef.current) return;

    connectedRef.current = true;
    setStatus("connected");

    // 既存 connect 処理
  };

  const stop = async () => {
    connectedRef.current = false;
    setStatus("stopped");

    // disconnect
  };

  return {
    status,
    micLevel,
    onStart: start,
    onStop: stop,
  };
}