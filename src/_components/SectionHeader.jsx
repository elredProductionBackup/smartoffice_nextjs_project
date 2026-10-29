"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa6";

export default function SectionHeader({
  title = "Members",
  tabs = [],
  // Optional controlled tab: pages that track the tab themselves pass these (e.g. Members)
  activeTab: activeTabProp,
  onTabChange,
  search = "",
  onSearch = () => {},
  searchBy="Name",
  setSearchBy=()=>{},
  searchByOptions = ["Name", "Title"],
  onAdd,
}) {
  const dropdownRef = useRef(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Fall back to the first tab when the URL has none, so the default tab is highlighted
  const activeTab =
    tabs.length > 0 ? activeTabProp || searchParams.get("tab") || tabs[0].key : null;

  const handleTabChange = (key) => {
    if (onTabChange) return onTabChange(key);
    // Keep the other query params (e.g. networkClusterCode); a new tab starts from page 1
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    params.delete("page");
    router.replace(`?${params.toString()}`);
  };

  /* ---------- DROPDOWN STATE ---------- */
  const [openDropdown, setOpenDropdown] = useState(false);


  /* ---------- SEARCH STATE ---------- */
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef(null);

  /* ---------- HANDLE INPUT ---------- */
  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
  };

  const clearSearch = () => {
    setLocalSearch("");
    onSearch(""); 
  };

  /* ---------- DEBOUNCE EFFECT ---------- */
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (localSearch.length >= 3 || localSearch.length === 0) {
        onSearch(localSearch);
      }
    }, 300); 

    return () => clearTimeout(debounceRef.current);
  }, [localSearch, onSearch]);

  /* ---------- OUTSIDE CLICK ---------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col w-full relative">
      {/* Title */}
      <h2 className="font-heading text-[24px] md:text-[32px] font-semibold mb-3 md:mb-[20px]">{title}</h2>

      {/* Tabs */}
       {tabs.length > 0 && (
         <div className="action-tabs relative lg:static flex items-center gap-[10px] border-b border-[#E5E7EB] overflow-x-auto pb-px md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
           {tabs.map((tab) => (
             <button
               key={tab.key}
               onClick={() => handleTabChange(tab.key)}
               className={`tab-item shrink-0 whitespace-nowrap px-3 md:px-[20px] py-[5px] text-lg md:text-[20px] font-[700] relative cursor-pointer
                 ${activeTab === tab.key ? "bordered text-[18px] md:text-[20px] text-[#0B57D0]" : "text-[#666666]"}`}
             >
               {tab.label}
             </button>
           ))}
           {onAdd && (
             <button
               type="button"
               onClick={onAdd}
               className="shrink-0 w-[50px] h-[36px] mb-[4px] rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] text-white flex items-center justify-center cursor-pointer hover:opacity-90 transition"
             >
               <FaPlus size={16} />
             </button>
           )}
         </div>
       )}

      {/* Search */}
      <div className="w-full mt-4 lg:mt-0 lg:w-[500px] lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 z-30">
        <div className="relative flex items-center h-12 lg:h-[60px] bg-[#F7F9FC] border border-[#E1E2E6] rounded-full px-[20px] gap-3">

          {/* Dropdown */}
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenDropdown((v) => !v)}
              className="flex items-center gap-2 font-[600] cursor-pointer whitespace-nowrap"
            >
              {searchBy}
              <span className="icon-park-outline--down text-[#999999]" />
            </button>

               {openDropdown && (
                 <div className="absolute p-[10px] top-[46px] left-[-20px] bg-white border border-[#F2F6FC] rounded-[20px] shadow-md min-w-[120px] w-max z-20 ">
                   {searchByOptions.map((item) => (
                     <button
                       key={item}
                       onClick={() => {
                         setSearchBy(item);
                         setOpenDropdown(false);
                       }}
                       className={`w-full cursor-pointer text-left whitespace-nowrap px-[12px] py-[8px] text-[16px] rounded-[10px] font-medium 
                         ${searchBy === item?'bg-[#F2F6FC]':''}`}

                     >
                       {item}
                     </button>
                   ))}
                 </div>
               )}
          </div>

          {/* Divider */}
          <div className="h-8 lg:h-[40px] w-[1px] shrink-0 bg-[#D4DFF1]" />

          {/* Input */}
          <input
            type="text"
            value={localSearch}
            placeholder={`Search by ${searchBy.toLowerCase()} (Min 3 chars)`}
            onChange={handleSearchChange}
            className="flex-1 min-w-0 bg-transparent outline-none text-base"
          />

          {/* Clear / Search Icon */}
          {localSearch ? (
            <button onClick={clearSearch} className="grid place-items-center cursor-pointer">
              <span className="akar-icons--cross" />
            </button>
          ) : (
            <span className="iconamoon--search-light" />
          )}
        </div>
      </div>
    </div>
  );
}
