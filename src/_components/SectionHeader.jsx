  "use client";

  import { useState, useEffect, useRef } from "react";
  import { useSearchParams, useRouter } from "next/navigation";

  export default function SectionHeader({
    title = "Members",
    tabs = [],
    search = "",
    onSearch = () => {},
  }) {
    const dropdownRef = useRef(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    const activeTab =
      tabs.length > 0 ? searchParams.get("tab") || 'members' : null;

    const handleTabChange = (key) => {
      router.replace(`?tab=${key}`);
    };

    /* ---------- DROPDOWN STATE ---------- */
    const [openDropdown, setOpenDropdown] = useState(false);
    const [searchBy, setSearchBy] = useState("Name");

    const handleSearchChange = (e) => {
      const value = e.target.value;
      console.log("Search:", value);
      onSearch(value);
    };

    const clearSearch = () => {
      onSearch("");
    };

    useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
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
        <h2 className="text-[32px] font-semibold mb-[20px]">{title}</h2>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="action-tabs flex items-center gap-[10px] border-b border-[#E5E7EB]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`tab-item px-[20px] py-[5px] text-[20px] font-[700] relative cursor-pointer
                  ${activeTab === tab.key ? "bordered text-[20px] text-[#0B57D0]" : "text-[#666666]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="w-[500px] absolute right-0 top-1/2 -translate-y-1/2 z-30">
          <div className="relative flex items-center h-[60px] bg-[#F7F9FC] border border-[#E1E2E6] rounded-full px-[20px] gap-3">

            {/* Dropdown */}
            <div ref={dropdownRef}  className="relative ">
              <button
                type="button"
                onClick={() => setOpenDropdown((v) => !v)}
                className="flex cursor-pointer items-center gap-2 text-[#1F2937] font-[600] text-[16px] whitespace-nowrap"
              >
                {searchBy}
                <span className="icon-park-outline--down text-[#999999]" />
              </button>

              {openDropdown && (
                <div className="absolute p-[10px] top-[46px] left-[-20px] bg-white border border-[#F2F6FC] rounded-[20px] shadow-md w-[120px] z-20 ">
                  {["Name", "Title"].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSearchBy(item);
                        setOpenDropdown(false);
                      }}
                      className={`w-full cursor-pointer text-left pl-[12px] py-[8px] text-[16px] rounded-[10px] font-medium 
                        ${searchBy === item?'bg-[#F2F6FC]':''}`}

                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-[40px] w-[1px] bg-[#D4DFF1]" />

            {/* Input */}
            <input
              type="text"
              value={search}
              placeholder={`Search member by ${searchBy.toLowerCase()} (Min 3 chars)`}
              onChange={handleSearchChange}
              className="flex-1 bg-transparent outline-none font-[500] text-[16px] text-[#666666]"
            />

            {/* Search / Clear Icon */}
            {search ? (
              <button
                onClick={clearSearch}
                className="flex items-center justify-center w-[32px] h-[32px] text-[#666666]"
              >
                <span className="akar-icons--cross" />
              </button>
            ) : (
              <button className="flex items-center justify-center w-[32px] h-[32px] text-[#666666]">
                <span className="iconamoon--search-light" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }