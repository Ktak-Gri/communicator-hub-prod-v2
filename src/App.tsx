import React from "react";
import { useAppState } from "./state/use-app-state";

import HomePage from "./ui/pages/HomePage";
import RolePlayPage from "./ui/pages/RolePlayPage";
import LearningPage from "./ui/pages/LearningPage";
import HistoryPage from "./ui/pages/HistoryPage";
import OneOnOneHub from "./ui/pages/OneOnOneHub";

function App() {
  const app = useAppState("home");

  if (app.isLoading) {
    return <div>Loading...</div>;
  }

  switch (app.page) {
    case "home":
      return <HomePage {...app} />;

    case "roleplay":
      return <RolePlayPage {...app} />;

    case "learning":
      return <LearningPage {...app} />;

    case "history":
      return <HistoryPage {...app} />;

    case "one-on-one":
      return <OneOnOneHub {...app} />;

    default:
      return <div>Unknown Page</div>;
  }
}

export default App;