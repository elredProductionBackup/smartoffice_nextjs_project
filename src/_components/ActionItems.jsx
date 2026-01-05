//   "use client";

//   import { useEffect, useState } from "react";
//   import { useRouter, useSearchParams } from "next/navigation";

//   import ActionHeader from "./ActionHeader";
//   import TodayItems from "./TodayItems";
//   import PastItems from "./PastItems";
//   import EmptyState from "./EmptyState";
//   import AllItems from "./AllItems";
//   import moment from "moment";
//   // import { actionableData } from "@/assets/helpers/sampleActionable";
//   // import { addActionable,getActionables  } from "@/services/actionable.service";
//   import ActionableDetailsModal from "./ActionableDetailsModal";
//   import { useDispatch, useSelector } from "react-redux";
// import { fetchActionables } from "@/store/actionable/actionableThunks";
// import { setActiveTab } from "@/store/actionable/actionableSlice";


//   const TABS_ITEMS = ["Past", "Today", "All"];

//   export default function ActionItems() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const activeItem = searchParams.get("item") || "today";
    
//     const [adding, setAdding] = useState(false);
//     const [searchOpen, setSearchOpen] = useState(false);
//     const [searchValue, setSearchValue] = useState("");

//     const [selectedTaskId, setSelectedTaskId] = useState(null);

//     const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

//     const todayISO = moment().format("YYYY-MM-DD");

// const dispatch = useDispatch();

// const {
//   items,
//   loading,
//   page,
//   limit,
//   total,
//   activeTab: storeActiveTab,
// } = useSelector((state) => state.actionable);

// const openTaskModal = (task) => {
//   setSelectedTaskId(task.id);
//   setIsTaskModalOpen(true);
// };

//     const closeTaskModal = () => {
//       setSelectedTaskId(null);
//       setIsTaskModalOpen(false);
//     };

//     const selectedTask = items.find((i) => i.id === selectedTaskId);


//   const addSubtask = (taskId, text) => {
//     setItems((prev) =>
//       prev.map((item) =>
//         item.id === taskId
//           ? {
//               ...item,
//               subtasks: [
//                 {
//                   id: Date.now().toString(),
//                   text,
//                   completed: false,
//                 },
//                 ...(item.subtasks || []),
//               ],
//             }
//           : item
//       )
//     );
//   };

//   const toggleSubtask = (taskId, subtaskId) => {
//     setItems((prev) =>
//       prev.map((item) =>
//         item.id === taskId
//           ? {
//               ...item,
//               subtasks: item.subtasks.map((s) =>
//                 s.id === subtaskId
//                   ? { ...s, completed: !s.completed }
//                   : s
//               ),
//             }
//           : item
//       )
//     );
//   };


//     /** TAB CHANGE */
//     const handleTabChange = (tab) => {
//       const params = new URLSearchParams(searchParams.toString());
//       params.set("item", tab.toLowerCase());
//       router.push(`?${params.toString()}`);
//     };



// const handleAdd = async (text) => {
//   if (!text.trim()) {
//     setAdding(false);
//     return;
//   }

//   const networkClusterCode =
//     typeof window !== "undefined"
//       ? localStorage.getItem("networkClusterCode")
//       : null;

//   if (!networkClusterCode) {
//     console.error("Missing networkClusterCode");
//     return;
//   }

//   // Temporary ID for optimistic UI
//   const tempId = `temp-${Date.now()}`;

//   const optimisticItem = {
//     id: tempId,
//     text,
//     title: text,
//     date: moment().format("YYYY-MM-DD"),
//     completed: false,
//     addedBy: "Meezan",
//     time: moment().format("hh:mm A"),
//     completedAt: null,
//     notes: "",
//     collaborators: [],
//     comments: [],
//   };


//   setItems((prev) => [optimisticItem, ...prev]);
//   setAdding(false);

//   try {
//     const payload = {
//       actionableId: "",
//       networkClusterCode,
//       title: text,
//       isCompleted: false,
//       category: "all",
//       notes: "",
//       linkedEvent: [],
//       dueDateTimeStamp: moment().endOf("day").toISOString(),
//       collaborators: [],
//     };

//     const res = await addActionable(payload);

//     if (res.status >= 200 && res.status < 300) {
//       const savedItem = res.data?.data || res.data;

//       setItems((prev) =>
//         prev.map((item) =>
//           item.id === tempId
//             ? {
//                 ...item,
//                 id: savedItem._id,
//                 text: savedItem.title ?? item.text,
//               }
//             : item
//         )
//       );

//     } else {
//       throw new Error("API failed");
//     }
//   } catch (err) {
//     console.error("Add actionable failed:", err);

//     // ❌ Rollback optimistic update
//     setItems((prev) => prev.filter((item) => item.id !== tempId));
//   }
// };


//     /** TOGGLE CHECK */
//     const toggleItem = (id) => {
//       console.log("ID",id)
//       setItems((prev) =>
//         prev.map((item) =>
//           item.id === id
//             ? {
//                 ...item,
//                 completed: !item.completed,
//                 completedAt: !item.completed ? new Date() : null,
//               }
//             : item
//         )
//       );
//     };

//     const onUpdateSubtask = (taskId, subtaskId, text) => {
//       setItems((prev) =>
//         prev.map((t) =>
//           t.id === taskId
//             ? {
//                 ...t,
//                 subtasks: t.subtasks.map((s) =>
//                   s.id === subtaskId ? { ...s, text } : s
//                 ),
//               }
//             : t
//         )
//       );
//     };

//     const onDeleteSubtask = (taskId, subtaskId) => {
//       setItems((prev) =>
//         prev.map((t) =>
//           t.id === taskId
//             ? {
//                 ...t,
//                 subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
//               }
//             : t
//         )
//       );
//     };


// useEffect(() => {
//   dispatch(
//     fetchActionables({
//       page,
//       limit,
//       search: searchValue,
//       dueSearchKey: storeActiveTab,
//     })
//   );
// }, [dispatch, page, limit, storeActiveTab, searchValue]);


//     return (
//       <div className="flex-1 flex flex-col gap-[20px] min-h-0 bg-[#F5F9FF] px-[30px] pt-[30px] mt-[20px] rounded-[20px]">
//         <ActionHeader
//           activeItem={activeItem} tabs={TABS_ITEMS}  
//           searchOpen={searchOpen} searchValue={searchValue} onSearchOpen={() => setSearchOpen(true)} 
//           onSearchClose={() => {
//             setSearchOpen(false);
//             setSearchValue("");
//           }}
//           onSearchChange={setSearchValue}
//           onAdd={() => setAdding(true)}
//           onTabChange={handleTabChange} />

//         <div className="flex flex-1 w-full overflow-y-auto">
//           {activeItem === "today" && (
//             <TodayItems
//               items={items}
//               adding={adding}
//               onAdd={handleAdd}
//               onToggle={toggleItem}
//               onCancelAdding={() => setAdding(false)}
//               onOpen={openTaskModal}
//             />
//           )}

//           {activeItem === "past" &&
//             (items.length ? (
//               <PastItems items={items} onToggle={toggleItem} />
//             ) : (
//               <EmptyState />
//             ))}

//           {activeItem === "all" &&
//             (items.length ? (
//               <AllItems items={items} onToggle={toggleItem} />
//             ) : (
//               <EmptyState />
//             ))}
//         </div>

//         {isTaskModalOpen && selectedTask && (
//           <ActionableDetailsModal
//             task={selectedTask}
//             onClose={closeTaskModal}
//             onAddSubtask={addSubtask}
//             onToggleSubtask={toggleSubtask}
//             onUpdateSubtask={onUpdateSubtask}
//             onDeleteSubtask={onDeleteSubtask}
//           />
//         )}
//       </div>
//     );
//   }


"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { CONSTANTS } from "@/utils/data";
import ActionHeader from "./ActionHeader";
import TodayItems from "./TodayItems";
import PastItems from "./PastItems";
import AllItems from "./AllItems";
import EmptyState from "./EmptyState";
import ActionableDetailsModal from "./ActionableDetailsModal";

import { createActionable, fetchActionables, removeActionable, toggleActionable } from "@/store/actionable/actionableThunks";
import { setActiveTab,setPage } from "@/store/actionable/actionableSlice";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import ActionableShimmer from "./Shimmer/ActionableShimmer";
const TABS_ITEMS = ["Past", "Today", "All"];

export default function ActionItems() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const activeItem = searchParams.get("item") ?? "today";
  const pageParam = Number(searchParams.get("page") ?? 1);

  const [adding, setAdding] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  /** REDUX STATE */
  const {
    items = [],
    loading,
    page=pageParam,
    limit = 10,
    total,
    activeTab,
  } = useSelector((state) => state.actionable);



useEffect(() => {
  dispatch(setActiveTab(activeItem));
  dispatch(setPage(pageParam));
}, [activeItem, pageParam, dispatch]);

  /**  Fetch actionables */
  useEffect(() => {
    dispatch(
      fetchActionables({
        page: pageParam,
        limit,
        search: debouncedSearch,
        dueSearchKey: activeItem,
      })
    );
  }, [dispatch, page, limit, activeTab, debouncedSearch]);

 const totalPages = Math.max(1, Math.ceil(total / limit));


  const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages) return;

  const params = new URLSearchParams(searchParams.toString());
  params.set("page", newPage);
  router.push(`?${params.toString()}`);
};


  /** OPEN MODAL */
  const openTaskModal = (task) => {
    setSelectedTaskId(task.actionableId || task._id);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setSelectedTaskId(null);
    setIsTaskModalOpen(false);
  };

  const selectedTask = items.find(
    (i) =>
      i.actionableId === selectedTaskId || i._id === selectedTaskId
  );

  /** TAB CHANGE */
const handleTabChange = (tab) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("item", tab.toLowerCase());
  params.set("page", 1);
  router.push(`?${params.toString()}`);
};

const handleAdd = (text) => {
  if (!text.trim()) {
    setAdding(false);
    return;
  }

  const networkClusterCode = localStorage.getItem("networkClusterCode");
  const tempId = `temp-${Date.now()}`;

  dispatch(
    createActionable({
      tempId,
      actionableId: tempId,
      networkClusterCode,
      title: text,
      isCompleted: false,
      category: "all",
      notes: "",
      linkedEvent: [],
      dueDateTimeStamp: moment.utc().toISOString(),
    })
  );


  setAdding(false);
};

  
  const handleDelete = (actionableId) => {
    const networkClusterCode = localStorage.getItem("networkClusterCode");
    dispatch(removeActionable({ actionableId: actionableId,networkClusterCode }));
  };
  

  const toggleItem = (item) => {
    dispatch(
      toggleActionable({
        actionableId: item.actionableId,
        isCompleted: !item.isCompleted,
      })
    );
  };

  const addSubtask = (actionableId, title) => {
    const networkClusterCode = localStorage.getItem("networkClusterCode");

    dispatch(
      createSubTask({
        actionableId,
        networkClusterCode,
        title,
        isCompleted: false,
      })
    );
  };

  const toggleSubtask = () => {};
  const onUpdateSubtask = () => {};
  const onDeleteSubtask = () => {};


  useEffect(() => {
  if (debounceRef.current) {
    clearTimeout(debounceRef.current);
  }

  debounceRef.current = setTimeout(() => {
    if (searchValue.length >= 3 || searchValue === "") {
      setDebouncedSearch(searchValue);

      // reset page on new search
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", 1);
      router.replace(`?${params.toString()}`);
    }
  }, 300);

  return () => clearTimeout(debounceRef.current);
}, [searchValue]);


useEffect(() => {
  if (!loading && page > 1 && total > 0 && items.length === 0) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page - 1);
    router.replace(`?${params.toString()}`);
  }
}, [items, page, loading, total]);


  return (
    <div className="flex-1 flex flex-col  min-h-0 bg-[#F5F9FF] px-[30px] pt-[30px] mt-[20px] rounded-[20px]">
       {loading && !searchValue ? 
       <>
        <ActionableShimmer/>
       </>
      :
      <>
      <ActionHeader
        activeItem={activeItem}
        tabs={TABS_ITEMS}
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
        debounceRef={debounceRef}
      />

        <div className="flex flex-1 w-full overflow-y-auto pt-[20px]">
          {activeItem === "today" && (
            <TodayItems
            items={items}
            adding={adding}
            onAdd={handleAdd}
            handleDelete={handleDelete}
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
              <AllItems 
              items={items} 
              onToggle={toggleItem}
              handleDelete={handleDelete}
              onOpen={openTaskModal}
              />
            ) : (
              <EmptyState />
            ))}
        </div>
        {total > 10 && (
          <div className="flex justify-between gap-2 bg-[#F2F7FF] pt-[20px] px-[30px] pb-[33px] sticky bottom-0">
            <div className="h-[48px] flex items-center text-lg font-semibold text-[#333333]">
              Showing {(page - 1) * CONSTANTS.ITEMS_PER_PAGE + 1} to {Math.min(page * CONSTANTS.ITEMS_PER_PAGE, total)} out of {total} entries
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 flex gap-[80px]">
              <button
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
                className="w-[48px] h-[48px] flex items-center justify-center rounded-full border-[1.2px] text-[24px]
                  border-[#0B57D0] text-[#0B57D0]
                  disabled:border-[#999999] disabled:text-[#999999]"
              >
                <IoIosArrowBack />
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => changePage(page + 1)}
                className="w-[48px] h-[48px] flex items-center justify-center rounded-full border-[1.2px] text-[24px]
                  border-[#0B57D0] text-[#0B57D0]
                  disabled:border-[#999999] disabled:text-[#999999]"
              >
                <IoIosArrowForward />
              </button>
            </div>

            <div />
          </div>
        )}

      </>
      }

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
