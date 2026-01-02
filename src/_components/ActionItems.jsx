  "use client";

  import { useEffect, useState } from "react";
  import { useRouter, useSearchParams } from "next/navigation";

  import ActionHeader from "./ActionHeader";
  import TodayItems from "./TodayItems";
  import PastItems from "./PastItems";
  import EmptyState from "./EmptyState";
  import AllItems from "./AllItems";
  import moment from "moment";
  // import { actionableData } from "@/assets/helpers/sampleActionable";
  import ActionableDetailsModal from "./ActionableDetailsModal";
import { addActionable,getActionables  } from "@/services/actionable.service";

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

    const [items, setItems] = useState([]);

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
                ...(item.subtasks || []),
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



const handleAdd = async (text) => {
  if (!text.trim()) {
    setAdding(false);
    return;
  }

  const networkClusterCode =
    typeof window !== "undefined"
      ? localStorage.getItem("networkClusterCode")
      : null;

  if (!networkClusterCode) {
    console.error("Missing networkClusterCode");
    return;
  }

  // Temporary ID for optimistic UI
  const tempId = `temp-${Date.now()}`;

  const optimisticItem = {
    id: tempId,
    text,
    title: text,
    date: moment().format("YYYY-MM-DD"),
    completed: false,
    addedBy: "Meezan",
    time: moment().format("hh:mm A"),
    completedAt: null,
    notes: "",
    collaborators: [],
    comments: [],
  };


  setItems((prev) => [optimisticItem, ...prev]);
  setAdding(false);

  try {
    const payload = {
      actionableId: "",
      networkClusterCode,
      title: text,
      isCompleted: false,
      category: "all",
      notes: "",
      linkedEvent: [],
      dueDateTimeStamp: moment().endOf("day").toISOString(),
      collaborators: [],
    };

    const res = await addActionable(payload);

    if (res.status >= 200 && res.status < 300) {
      const savedItem = res.data?.data || res.data;

      setItems((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                id: savedItem._id,
                text: savedItem.title ?? item.text,
              }
            : item
        )
      );

    } else {
      throw new Error("API failed");
    }
  } catch (err) {
    console.error("Add actionable failed:", err);

    // ❌ Rollback optimistic update
    setItems((prev) => prev.filter((item) => item.id !== tempId));
  }
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


    useEffect(() => {
      const fetchActionables = async () => {
        const networkClusterCode =
          typeof window !== "undefined"
            ? localStorage.getItem("networkClusterCode")
            : null;

        if (!networkClusterCode) return;

        try {
          const res = await getActionables({
            networkClusterCode,
            start: 1,
            offset: 50,
            search: searchValue,
            dueSearchKey: activeItem, 
          });

          if (res.status >= 200 && res.status < 300) {
            // const list = res.data?.result || [];

            setItems(res.data?.result || []);
          }
        } catch (err) {
          console.error("Fetch actionables failed:", err);
        }
      };

      fetchActionables();
    }, [activeItem, searchValue]);

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
              items={items}
              adding={adding}
              onAdd={handleAdd}
              onToggle={toggleItem}
              onCancelAdding={() => setAdding(false)}
              onOpen={openTaskModal}
            />
          )}

          {activeItem === "past" &&
            (items.length ? (
              <PastItems items={items} onToggle={toggleItem} />
            ) : (
              <EmptyState />
            ))}

          {activeItem === "all" &&
            (items.length ? (
              <AllItems items={items} onToggle={toggleItem} />
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
