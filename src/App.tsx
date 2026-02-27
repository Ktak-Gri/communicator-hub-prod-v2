import { useAppState } from "./state/use-app-state";

import LoginPage from "./ui/pages/LoginPage";
import HomePage from "./ui/pages/HomePage";
import RolePlayPage from "./ui/pages/RolePlayPage";
import LearningPage from "./ui/pages/LearningPage";
import HistoryPage from "./ui/pages/HistoryPage";
import OneOnOneHub from "./ui/pages/OneOnOneHub";

function App() {
  // ✅ アプリ中枢State取得
  const { page, navigate } = useAppState();

  // ✅ 表示画面コンテナ
  let screen: React.ReactNode = null;

  // ✅ 画面制御（Router代替）
  switch (page) {
    case "login":
      screen = <LoginPage navigate={navigate} />;
      break;

    case "home":
      screen = <HomePage navigate={navigate} />;
      break;

    case "roleplay":
      screen = <RolePlayPage navigate={navigate} />;
      break;

    case "learning":
      screen = <LearningPage navigate={navigate} />;
      break;

    case "history":
      screen = <HistoryPage navigate={navigate} />;
      break;

    case "oneonone":
      screen = <OneOnOneHub navigate={navigate} />;
      break;

    default:
      screen = <div>Unknown Screen</div>;
  }

  // ✅ 単一return（超重要）
  return screen;
}

export default App;