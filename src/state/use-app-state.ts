export const useAppState = (
  initialPage: ActivePage = "login"
) => {

  const [page, setPage] =
    useState<ActivePage>(initialPage);

  const [isLoading, setIsLoading] =
    useState(false);

  return {
    page,
    navigate: setPage,
    isLoading,
    setIsLoading,
  };
};