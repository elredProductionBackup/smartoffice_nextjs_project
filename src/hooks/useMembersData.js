import { useEffect, useState } from "react";
import { sampleData } from "@/assets/helpers/sampleMember";
import { boardData } from "@/assets/helpers/sampleMember";
export function useMembersData({ tab, page, search, limit = 10 }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); 

    const timer = setTimeout(() => {
      let source = tab === "board" ? boardData : sampleData;
      let result = source;

      if (search.trim().length >= 3) {
        const value = search.toLowerCase();
        result = source.filter(
          (item) =>
            item.name.toLowerCase().includes(value) ||
            item.title.toLowerCase().includes(value)
        );
      }

      setTotal(result.length);
      setData(result.slice((page - 1) * limit, page * limit));
      setLoading(false);
    }, 1200); 

    return () => clearTimeout(timer);
  }, [tab, page, search, limit]);

  return { data, total, loading };
}
