"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import ActionHeader from "./ActionHeader";
import TodayItems from "./TodayItems";
import EmptyState from "./EmptyState";
// import WeeklyView from "./WeeklyView";

const TABS_ITEMS = ["Past", "Today", "All",];

export default function ActionItems() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeItem = searchParams.get("item") || "today";

  const [weekDate, setWeekDate] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [adding, setAdding] = useState(false);

const [items, setItems] = useState([
  {
    id: 1,
    text: "Today meeting with channel partner at 5:00 PM",
    avatars: [],
  },
  {
    id: 2,
    text: "Your stay is confirmed at Hotel Gateway Grandeur on 5 Dec 2025.",
    avatars: [{}, {}, {},{},{}],
    date: "19 Dec 2025",
  },
  {
    id: 3,
    text: "Meeting with Jason Statham, this Saturday 06:00 PM",
    avatars: [{}],
    date: "19 Dec 2025",
  },
]);


  const handleTabChange = (tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("item", tab.toLowerCase());
    router.push(`?${params.toString()}`);
  };

  const handleAdd = (text) => {
    if (!text.trim()) return setAdding(false);
    setItems((prev) => [{ id: Date.now(), text }, ...prev]);
    setAdding(false);
  };

  const filteredItems = items.filter((item) =>
    item.text.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-235px)] rounded-[20px] bg-[#F5F9FF] px-[30px] pt-[30px] mt-[20px] gap-[20px]">
      <ActionHeader
        activeItem={activeItem}
        tabs={TABS_ITEMS}
        weekDate={weekDate}         
        setWeekDate={setWeekDate}    
        searchOpen={searchOpen}
        searchValue={searchValue}
        onSearchOpen={() => setSearchOpen(true)}
        onSearchClose={() => {
          setSearchOpen(false);
          setSearchValue("");
        }}
        onSearchChange={setSearchValue}
        onAdd={() => setAdding(true)}
        onTabChange={handleTabChange}
      />

      <div className="flex flex-1 w-[100%] overflow-y-auto">
        {activeItem === "today" &&
          (filteredItems.length ? (
            <TodayItems
              items={filteredItems}
              adding={adding}
              onAdd={handleAdd}
            />
          ) : (
            <EmptyState />
          ))}
      </div>
    </div>
  );
}

        // {activeItem === "weekly" && (
        //       <WeeklyView
        //         weekDate={weekDate}
        //         tasks={[
        //           {
        //             id: 1,
        //             text: "Today meeting with channel partner at 5:00 PM",
        //             date: weekDate,
        //             hour: 17,       
        //           },
        //         ]}
        //       />
        //     )}