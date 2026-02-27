import { useState } from "react";
import { ActivePage } from "../types";

export const useAppState = () => {

  const [page, setPage] =
    useState<ActivePage>("login");

  return {
    page,
    navigate: setPage,
  };
};