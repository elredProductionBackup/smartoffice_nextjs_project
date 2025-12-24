"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import ActionHeader from "./ActionHeader";
import TodayItems from "./TodayItems";
import PastItems from "./PastItems";
import EmptyState from "./EmptyState";
import AllItems from "./AllItems";
import moment from "moment";

const TABS_ITEMS = ["Past", "Today", "All"];

export default function ActionItems() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeItem = searchParams.get("item") || "today";
  
  const [adding, setAdding] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const todayISO = moment().format("YYYY-MM-DD");
  // const formatDate = (dateStr) => moment(dateStr).format("DD MMM YYYY");

  const [items, setItems] = useState([
  {
    id: 1,
    text: "Today meeting with channel partner at 5:00 PM",
    date: "2025-12-23",
    completed: false,
    avatars:[{},{},{},{},{}],
    completedAt: null,
  },
  {
    id: 2,
    text: "Your stay is confirmed at Hotel Gateway Grandeur",
    date: "2025-12-19",
    completed: false,
    avatars:[{},{}],
    completedAt: null,
  },
  {
    id: 3,
    text: "Meeting with Jason Statham",
    date: "2025-12-19",
    completed: true,
    completedAt: new Date(),
  },
      {
    id: 4,
    text: "Old follow-up call",
    date: "2025-12-15",
    completed: true,
    completedAt: new Date(),
  },
  ]);

  /** TAB CHANGE */
  const handleTabChange = (tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("item", tab.toLowerCase());
    router.push(`?${params.toString()}`);
  };

  /** ADD ITEM */
  const handleAdd = (text) => {
    if (!text.trim()) return setAdding(false);

    setItems((prev) => [
      {
        id: Date.now(),
        text,
        date: moment().format("YYYY-MM-DD"), // today
        completed: false,
        completedAt: null,
      },
      ...prev,
    ]);

    setAdding(false);
  };

  /** TOGGLE CHECK */
  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date() : null,
            }
          : item
      )
    );
  };

  /** FILTERS */
  const todayItems = items.filter(
    (i) =>
      !i.completed &&
      moment(i.date).isSame(todayISO, "day") &&
      i.text.toLowerCase().includes(searchValue.toLowerCase())
  );


  const pastItems = items.filter(
    (i) =>
      i.completed &&
      i.text.toLowerCase().includes(searchValue.toLowerCase())
  );

  const filteredAllItems = items.filter(
    (i) =>
      !i.completed &&
      i.text.toLowerCase().includes(searchValue.toLowerCase())
  );



  return (
    <div className="flex flex-col h-[calc(100vh-235px)] rounded-[20px] bg-[#F5F9FF] px-[30px] pt-[30px] mt-[20px] gap-[20px]">
      <ActionHeader
        activeItem={activeItem}
        tabs={TABS_ITEMS}
        // weekDate={weekDate}         
        // setWeekDate={setWeekDate}    
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

      <div className="flex flex-1 w-full overflow-y-auto">
        {activeItem === "today" && (
          <TodayItems
            items={todayItems} // may be empty
            adding={adding}
            onAdd={handleAdd}
            onToggle={toggleItem}
            onCancelAdding={() => setAdding(false)} 
          />
        )}

        {/* {activeItem === "today" &&
          (todayItems.length ? (
            <TodayItems
              items={todayItems}
              adding={adding}
              onAdd={handleAdd}
              onToggle={toggleItem}
            />
          ) : (
            <EmptyState />
          ))} */}

        {activeItem === "past" &&
          (pastItems.length ? (
            <PastItems
              items={pastItems}
              onToggle={toggleItem}
            />
          ) : (
            <EmptyState />
          ))}

          {activeItem === "all" &&
          (filteredAllItems.length ? (
            <AllItems
              items={filteredAllItems}
              onToggle={toggleItem}
            />
          ) : (
            <EmptyState />
          ))}

      </div>
    </div>
  );
}
