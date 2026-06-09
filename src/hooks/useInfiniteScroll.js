import { useState, useEffect, useCallback } from "react";

export default function useInfiniteScroll(fetchFn, limit = 12) {
  const [items,   setItems]   = useState([]);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const newItems = await fetchFn(page, limit);

    if (newItems.length < limit) setHasMore(false);
    setItems((prev) => [...prev, ...newItems]);
    setPage((prev) => prev + 1);
    setLoading(false);
  }, [page, loading, hasMore, fetchFn, limit]);

  useEffect(() => {
    loadMore();
  }, []);

  return { items, loading, hasMore, loadMore };
}