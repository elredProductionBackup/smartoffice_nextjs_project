import { useMemo } from "react";

export const usePagination = ({ total = 0, currentPage = 1, perPage = 10 }) => {
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / perPage)),
    [total, perPage]
  );

  const startIndex = useMemo(
    () => (total === 0 ? 0 : (currentPage - 1) * perPage + 1),
    [currentPage, perPage, total]
  );

  const endIndex = useMemo(
    () => Math.min(currentPage * perPage, total),
    [currentPage, perPage, total]
  );

  return {
    totalPages,
    startIndex,
    endIndex,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  };
};
