import RolePlayScreen from "../../ui-lib/components/RolePlayScreen";
import { useRolePlaySession } from "../hooks/useRolePlaySession";

export default function RolePlayContainer() {

  const {
    startSession,
    stopSession,
    messages,
  } = useRolePlaySession();

  return (
    <RolePlayScreen
      traineeName="テストユーザー"
      scenario={{
        id: "training",
        title: "料金相談",
        initialInquiry: "料金プランについて教えてください"
      }}

      /* ===== Gemini Binding ===== */
      onStartCall={startSession}
      onEndCall={stopSession}

      transcript={messages}

      onBack={() => console.log("BACK")}
    />
  );
}