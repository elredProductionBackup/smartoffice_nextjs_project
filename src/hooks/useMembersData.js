import { useEffect, useState } from "react";
import api from "@/services/axios";

export function useMembersData({
  tab,
  page,
  search,
  searchBy,
  limit = 10,
}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMembers = async () => {
      setLoading(true);


      const isSearching = Boolean(search?.trim());
      const effectivePage = isSearching ? 1 : page;

      const start = (effectivePage - 1) * limit + 1;
      const offset = effectivePage * limit;
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      try {
        const response = await api.get("/smartOfficeGetMembersList", {
          params: {
            networkClusterCode: networkClusterCode,
            start,
            offset,
            filterBy: tab === "board" ? "board" : "member",
            searchBy: searchBy.toLowerCase(),
            searchKey: search?.trim() || "",
          },
        });

        if (!isMounted) return;

        if (response.status === 200 && response.data?.success) {
          const result = response.data.result || [];

          const formattedData = result.map((item) => ({
            id: item.userCode,
            name: `${item.firstname} ${item.lastname}`.trim(),
            email: item.email,
            phone: item.phoneNumber,
            userType: item.userType,
            title: item.title || [],
            avatar: item.dpURL,
            location: item.location,
            documents:item?.documents || [],
            spouse:item?.spouseDetails?.name || "",
            children: item?.childrenDetails || []
          }));

          setData(formattedData);
          setTotal(response.data.totalCount || 0);
        } else {
          setData([]);
          setTotal(0);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
        setData([]);
        setTotal(0);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [tab, page, search, limit]);

  return { data, total, loading };
}
