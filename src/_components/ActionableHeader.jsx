// "use client";

// import Image from "next/image";
// import searchIcon from "@/assets/logo/search.svg";
// import { useSearchParams, useRouter } from "next/navigation";

// export default function SectionHeader({
//   title = "Members",
//   tabs = [],
//   searchPlaceholder = "Search",
//   onSearch = () => {},
// }) {
//   const searchParams = useSearchParams();
//   const router = useRouter();

//   const activeTab = searchParams.get("tab") || tabs[0].key;

//   const handleTabClick = (key) => {
//     router.replace(`?tab=${key}`);
//   };

//   return (
//     <div className="flex items-center justify-between w-full">
//       {/* LEFT — Title + Tabs */}
//       <div>
//         <h2 className="text-2xl font-semibold mb-3">{title}</h2>

//         <div className="flex gap-3">
//           {tabs.map((tab) => (
//             <button
//               key={tab.key}
//               onClick={() => handleTabClick(tab.key)}
//               className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer
//                 ${
//                   activeTab === tab.key
//                     ? "bg-[#344F88] text-white"
//                     : "bg-[#F4F5F7] text-gray-600"
//                 }
//               `}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* RIGHT — Search */}
//       <div className="w-[350px] relative">
//         <div className="relative bg-[#F2F6FC] border border-[#E1E2E6] h-14 rounded-full px-6">

//           <Image
//             src={searchIcon}
//             alt="search"
//             className="absolute left-6 top-1/2 -translate-y-1/2"
//           />

//           <input
//             type="text"
//             placeholder={searchPlaceholder}
//             onChange={(e) => onSearch(e.target.value)}
//             className="w-full h-full bg-transparent pl-10 outline-none"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import Image from "next/image";
import searchIcon from "@/assets/logo/search.svg";
import { useSearchParams, useRouter } from "next/navigation";

// export default function SectionHeader({
//   title = "Members",
//   tabs = [],
//   searchPlaceholder = "Search",
//   onSearch = () => {},
// }) {
//   const searchParams = useSearchParams();
//   const router = useRouter();

//   // Check if tabs exist
//   const hasTabs = Array.isArray(tabs) && tabs.length > 0;

//   // Active tab only if tabs exist
//   const activeTab = hasTabs ? (searchParams.get("tab") || tabs[0].key) : null;

//   const handleTabClick = (key) => {
//     router.replace(`?tab=${key}`);
//   };

//   return (
//     <div className="flex items-center justify-between w-full">
//       {/* LEFT — Title + Tabs */}
//       <div>
//         <h2 className="text-2xl font-semibold mb-3">{title}</h2>

//         {hasTabs && (
//           <div className="flex gap-3">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.key}
//                 onClick={() => handleTabClick(tab.key)}
//                 className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer
//                   ${
//                     activeTab === tab.key
//                       ? "bg-[#344F88] text-white"
//                       : "bg-[#F4F5F7] text-gray-600"
//                   }
//                 `}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* RIGHT — Search */}
//       <div className="w-[350px] relative">
//         <div className="relative bg-[#F2F6FC] border border-[#E1E2E6] h-14 rounded-full px-6">

//           <Image
//             src={searchIcon}
//             alt="search"
//             className="absolute left-6 top-1/2 -translate-y-1/2"
//           />

//           <input
//             type="text"
//             placeholder={searchPlaceholder}
//             onChange={(e) => onSearch(e.target.value)}
//             className="w-full h-full bg-transparent pl-10 outline-none"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }


export default function ActionableHeader({
  title = "Members",
  tabs = [],
  searchPlaceholder = "Search",
  onSearch = () => {},
  taskCount,
  refresh 
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = tabs.length > 0
    ? (searchParams.get("tab") || tabs[0].key)
    : null;

  const handleTabClick = (key) => {
    router.replace(`?tab=${key}`);
  };

  return (
    <div className="flex items-center justify-between w-full">
      
      {/* LEFT — Title + Count */}
      <div>
        {/* Title Row */}
        <div className="flex items-center gap-[20px] mb-[20px]">
          <h2 className="text-2xl font-semibold">{title}</h2>

          {typeof taskCount === "number" && (
            <div className="flex items-center gap-2 h-[35px] px-[12px] rounded-[60px] bg-[#0B57D0] text-white text-[20px] font-medium">
              <span className="pajamas--task-done text-white"></span>
              <span>{taskCount}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="flex gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer
                  ${
                    activeTab === tab.key
                      ? "bg-[#344F88] text-white"
                      : "bg-[#F4F5F7] text-gray-600"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Refresh Button */}
      {typeof refresh && (
        <button
          onClick={() => window.location.reload()}
          className="h-[35px] w-[35px] flex items-center justify-center rounded-full border-[1.2px] border-[#E9E9E9] hover:bg-[#F5F5F5] transition cursor-pointer"
        >
          <span className="mage--refresh"></span>
        </button>
      )}
    </div>
  );
}

        //   {/* RIGHT — Search */}
        // {/* <div className="w-[350px] relative">
        //   <div className="relative bg-[#F2F6FC] border border-[#E1E2E6] h-14 rounded-full px-6">
        //     <Image
        //       src={searchIcon}
        //       alt="search"
        //       className="absolute left-6 top-1/2 -translate-y-1/2"
        //     />
  
        //     <input
        //       type="text"
        //       placeholder={searchPlaceholder}
        //       onChange={(e) => onSearch(e.target.value)}
        //       className="w-full h-full bg-transparent pl-10 outline-none"
        //     />
        //   </div>
        // </div> */}