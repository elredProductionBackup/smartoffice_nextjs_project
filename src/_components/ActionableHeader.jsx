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

  const handleTabClick = (key) => {
    router.replace(`?tab=${key}`);
  };

  return (
    <div className="flex items-center justify-between w-full">
      
      {/* LEFT — Title + Count */}
      <div>
        {/* Title Row */}
        <div className="flex items-center gap-[20px] mb-[20px]">
          <h2 className="text-[32px] font-semibold ">{title}</h2>

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
      {refresh && (
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