// "use client";

// import { useRouter, useSearchParams } from "next/navigation";
// import { useState } from "react";

// const DEFAULT_TABS = [
//   { label: "All", value: "all" },
// ];

// export default function ActionableTabs() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const activeTab = searchParams.get("tab") || "all";

//   const [tabs, setTabs] = useState(DEFAULT_TABS);
//   const [showModal, setShowModal] = useState(false);
//   const [newTabName, setNewTabName] = useState("");

//   const handleTabChange = (tab) => {
//     const params = new URLSearchParams(searchParams.toString());
//     params.set("tab", tab);
//     router.push(`?${params.toString()}`);
//   };

//   const handleAddTab = () => {
//     if (!newTabName.trim()) return;

//     const value = newTabName.toLowerCase().replace(/\s+/g, "-");
//     const newTab = { label: newTabName.trim(), value };

//     setTabs((prev) => [...prev, newTab]);
//     handleTabChange(value);
//     setNewTabName("");
//     setShowModal(false);
//   };

//   return (
//     <div className="action-tabs flex items-center gap-[10px] relative">
//       {/* Tabs */}
//       {tabs.map((tab) => (
//         <button
//           key={tab.value}
//           onClick={() => handleTabChange(tab.value)}
//           className={`tab-item relative
//             px-[20px] py-[5px] cursor-pointer 
//             text-[20px] font-[700] transition
//             ${activeTab === tab.value ? "bordered" : ""}`}
//         >
//           {tab.label}
//         </button>
//       ))}

//       {/* Modal */}
//       {showModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-[#0005] z-50">
//           <div className="bg-white p-6 rounded-md w-[300px] space-y-4">
//             <h3 className="text-lg font-bold">Create new list</h3>
//             <input
//               type="text"
//               value={newTabName}
//               onChange={(e) => setNewTabName(e.target.value)}
//               placeholder="Enter Name"
//               className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
//             />
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddTab}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//               >
//                 Done
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function ActionableTabs({
  tabs = [],
  defaultTab,
  allowAdd = false,
  onAddClick,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const validTabValues = useMemo(
    () => tabs.map((t) => t.value),
    [tabs]
  );

  const urlTab = searchParams.get("tab");

  const activeTab = validTabValues.includes(urlTab)
    ? urlTab
    : defaultTab || validTabValues[0];

  useEffect(() => {
    if (!activeTab) return;

    if (urlTab !== activeTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", activeTab);
      router.replace(`?${params.toString()}`);
    }
  }, [activeTab, urlTab, router, searchParams]);

  const handleTabChange = (tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="action-tabs flex items-center gap-[10px] relative text-[#666666]">
       {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleTabChange(tab.value)}
          className={`tab-item relative
            px-[20px] py-[5px] cursor-pointer 
            text-[20px] font-[700] transition
            ${activeTab === tab.value ? "bordered text-[#0B57D0] " : ""}`}
        >
          {tab.label}
        </button>
      ))}

      {/* {allowAdd && (
        <button className="h-[24px] w-[24px] rounded-full text-[20px] text-white font-[600] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer flex items-center justify-center outline-none border-none"
        onClick={onAddClick}>
          <span className="ic--round-plus"></span>
        </button>
      )} */}
    </div>
  );
}
