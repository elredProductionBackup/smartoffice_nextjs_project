  "use client";

  import { useState } from "react";
  import { useRouter, useSearchParams } from "next/navigation";

  import ActionHeader from "./ActionHeader";
  import TodayItems from "./TodayItems";
  import PastItems from "./PastItems";
  import EmptyState from "./EmptyState";
  import AllItems from "./AllItems";
  import moment from "moment";
  import { actionableData } from "@/assets/helpers/sampleActionable";
  import ActionableDetailsModal from "./ActionableDetailsModal";

  const TABS_ITEMS = ["Past", "Today", "All"];

  export default function ActionItems() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeItem = searchParams.get("item") || "today";
    
    const [adding, setAdding] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const todayISO = moment().format("YYYY-MM-DD");

    const [items, setItems] = useState(actionableData || []);
    

const openTaskModal = (task) => {
  setSelectedTaskId(task.id);
  setIsTaskModalOpen(true);
};

    const closeTaskModal = () => {
      setSelectedTaskId(null);
      setIsTaskModalOpen(false);
    };

    const selectedTask = items.find((i) => i.id === selectedTaskId);


  const addSubtask = (taskId, text) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              subtasks: [
                {
                  id: Date.now().toString(),
                  text,
                  completed: false,
                },
                ...(item.subtasks || []), // 👈 TOP
              ],
            }
          : item
      )
    );
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              subtasks: item.subtasks.map((s) =>
                s.id === subtaskId
                  ? { ...s, completed: !s.completed }
                  : s
              ),
            }
          : item
      )
    );
  };


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
          addedBy: "Meezan",
          time: "10:30 PM",
          completedAt: null,
          notes: "",
          collaborators: [],
          comments: [],
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


    const onUpdateSubtask = (taskId, subtaskId, text) => {
      setItems((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((s) =>
                  s.id === subtaskId ? { ...s, text } : s
                ),
              }
            : t
        )
      );
    };

    const onDeleteSubtask = (taskId, subtaskId) => {
      setItems((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
              }
            : t
        )
      );
    };



    return (
      <div className="flex-1 flex flex-col gap-[20px] min-h-0 bg-[#F5F9FF] px-[30px] pt-[30px] mt-[20px] rounded-[20px]">
        <ActionHeader
          activeItem={activeItem} tabs={TABS_ITEMS}  
          searchOpen={searchOpen} searchValue={searchValue} onSearchOpen={() => setSearchOpen(true)} 
          onSearchClose={() => {
            setSearchOpen(false);
            setSearchValue("");
          }}
          onSearchChange={setSearchValue}
          onAdd={() => setAdding(true)}
          onTabChange={handleTabChange} />
        <div className="flex flex-1 w-full overflow-y-auto">
          {activeItem === "today" && (
            <TodayItems
              items={todayItems} 
              adding={adding}
              onAdd={handleAdd}
              onToggle={toggleItem}
              onCancelAdding={() => setAdding(false)} 
              onOpen={openTaskModal} 
            />
          )}

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

        {isTaskModalOpen && selectedTask && (
          <ActionableDetailsModal
            task={selectedTask}
            onClose={closeTaskModal}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onUpdateSubtask={onUpdateSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        )}
      </div>
    );
  }
