import { useRef, useCallback } from "react";

const useInfiniteScrollObserver = ({
  hasMore,
  loading,
  onLoadMore,
}) => {
  const observer = useRef(null);

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMore
          ) {
            onLoadMore();
          }
        },
        {
          root: null, 
          rootMargin: "200px", 
        }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, onLoadMore]
  );

  return lastElementRef;
};

export default useInfiniteScrollObserver;