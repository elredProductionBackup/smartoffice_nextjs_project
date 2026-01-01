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


// "use client";

// import { getMembersList } from "@/services/member.service";
// import { useEffect, useState } from "react";

// export const useMembersData = ({
//   tab = "member",
//   page = 1,
//   search = "",
//   limit = 10,
// }) => {
//   const [data, setData] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchMembers = async () => {
//       setLoading(true);

//       try {
//         const res = await getMembersList({
//           networkClusterCode: localStorage.getItem("networkClusterCode"),

//           // pagination
//           start: page,
//           offset: limit,

//           // defaults + mapping
//           filterBy: tab === "board" ? "board" : "member",
//           searchBy: "name", // default
//           searchKey: search,
//         });

//         if (res?.data?.success) {
//           setData(res.data.result || []);
//           setTotal(res.data.total || 0);
//         } else {
//           setData([]);
//           setTotal(0);
//         }
//       } catch (err) {
//         console.error("Members fetch failed:", err);
//         setData([]);
//         setTotal(0);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMembers();
//   }, [tab, page, search, limit]);

//   return { data, total, loading };
// };
