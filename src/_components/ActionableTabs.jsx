"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function ActionableTabs({
  tabs = [],
  defaultTab,
  events= false,
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
    params.delete("page");
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
        {events &&
        <button
          onClick={() => router.push('/dashboard/events/create')}
          className="py-[4px] px-[12px] rounded-[100px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer text-white font-[500] flex items-center gap-[4px]"
        >
         <span className="ic--round-plus"></span> Create event
        </button>}

      {/* {allowAdd && (
        <button className="h-[24px] w-[24px] rounded-full text-[20px] text-white font-[600] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer flex items-center justify-center outline-none border-none"
        onClick={onAddClick}>
          <span className="ic--round-plus"></span>
        </button>
      )} */}
    </div>
  );
}
