import React from "react";
import { useRolePlaySession } from "../hooks/useRolePlaySession";
import { TrainingView } from "../ui/views/ui-view-training";

export const TrainingPage = () => {
  const session = useRolePlaySession();

  return <TrainingView {...session} />;
};