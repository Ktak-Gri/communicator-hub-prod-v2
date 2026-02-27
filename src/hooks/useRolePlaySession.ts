import { useEffect, useRef } from "react";

/**
 * ===============================
 * 🔒 GLOBAL CONNECTION LOCK
 * ===============================
 * アプリ全体でAI接続を1本に固定
 */
const globalSessionRef = {
  connected: false
};

type Options = {
  enabled: boolean;
  onConnecting?: () => void;
  onConnected?: () => void;
  onAIThinking?: () => void;
  onAISpeaking?: () => void;
  onIdle?: () => void;
};

export const useRolePlaySession = ({
  enabled,
  onConnecting,
  onConnected,
  onAIThinking,
  onAISpeaking,
  onIdle
}: Options) => {

  const sessionRef = useRef<any>(null);

  /**
   * ===============================
   * CONNECT
   * ===============================
   */
  useEffect(() => {

    if (!enabled) return;

    /**
     * 🚨 二重接続完全防止
     */
    if (globalSessionRef.connected) {
      console.log("⚠ Session already connected");
      return;
    }

    const connect = async () => {

      try {
        onConnecting?.();

        console.log("🔄 Connecting AI Session...");

        /**
         * =====================
         * TODO:
         * Gemini Live 接続処理
         * WebRTC / WS 接続をここへ
         * =====================
         */

        // ---- MOCK CONNECT ----
        await new Promise(r => setTimeout(r, 800));

        sessionRef.current = {};

        globalSessionRef.connected = true;

        console.log("✅ AI Connected");

        onConnected?.();

        /**
         * ---- MOCK STATE LOOP ----
         * （後でGeminiイベントへ置換）
         */
        setTimeout(() => onAIThinking?.(), 2000);
        setTimeout(() => onAISpeaking?.(), 3500);
        setTimeout(() => onIdle?.(), 6000);

      } catch (err) {
        console.error("Connection failed", err);
      }
    };

    connect();

    /**
     * ===============================
     * CLEANUP
     * ===============================
     */
    return () => {

      console.log("🧹 Session cleanup");

      if (sessionRef.current) {
        /**
         * TODO:
         * Gemini disconnect
         */
        sessionRef.current = null;
      }

      globalSessionRef.connected = false;
    };

  }, [enabled]);

  return {
    connected: globalSessionRef.connected
  };
};