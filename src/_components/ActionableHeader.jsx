"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function ActionableHeader({
  title = "Members",
  tabs = [],
  searchPlaceholder = "Search",
  onSearch = () => {},
  taskCount,
  refresh = false
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = tabs.length > 0
    ? (searchParams.get("tab") || tabs[0].key)
    : null;

  // Keep the other query params (e.g. networkClusterCode) when switching tabs
  const handleTabClick = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-3 w-full">
      
      {/* LEFT — Title + Count */}
      <div>
        {/* Title Row */}
        <div className={`flex items-center gap-3 md:gap-[20px] ${tabs.length > 0 ? "mb-3" : "mb-0"} md:mb-[20px]`}>
          <h2 className="font-heading text-[24px] md:text-[32px] font-semibold">{title}</h2>

          {typeof taskCount === "number" && (
            <div className="flex items-center gap-2 h-[30px] md:h-[35px] px-[12px] rounded-[60px] bg-[#0B57D0] text-white text-[16px] md:text-[20px] font-medium">
              <span className="pajamas--task-done text-white"></span>
              <span>{taskCount}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer
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
      {refresh && (
        <button
          onClick={() => window.location.reload()}
          className="h-10 w-10 md:h-[35px] md:w-[35px] shrink-0 flex items-center justify-center rounded-full border-[1.2px] border-[#E9E9E9] hover:bg-[#F5F5F5] transition cursor-pointer"
        >
          <span className="mage--refresh"></span>
        </button>
      )}
    </div>
  );
}