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
import { createActionable, createSubTask, fetchActionables, removeActionable, removeSubTask, toggleActionable, updateActionable, updateSubTask, upsertSubTask } from "@/store/actionable/actionableThunks";
import { addSubTaskOptimistic, removeSubTaskOptimistic, setActiveTab, setPage, updateSubTaskOptimistic } from "@/store/actionable/actionableSlice";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import ActionableShimmer from "./Shimmer/ActionableShimmer";
import { closeModal } from "@/store/actionable/actionableUiSlice";
import DatepickerModal from "./DatepickerModal";
import DeleteConfirm from "./ConfirmationPopups/DeleteConfirm";
const TABS_ITEMS = ["Past", "Today", "All"];

export default function ActionItems() {

  const { modal } = useSelector((state) => state.actionableUi);

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const activeItem = searchParams.get("item") ?? "today";
  const pageParam = Number(searchParams.get("page") ?? 1);

  const [adding, setAdding] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const debounceTimerRef = useRef(null);
  const isFirstRender = useRef(true); 
  const [debouncedSearch, setDebouncedSearch] = useState("");


  /** REDUX STATE */
  const {
    items = [],
    loading,
    page = pageParam,
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

  const selectedTask = items.find(
    (i) =>
      i.actionableId === modal.taskId || i._id === modal.taskId
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
        // dueDateTimeStamp: moment.utc().toISOString(),
        dueDateTimeStamp: "",
      })
    );


    setAdding(false);
  };


  const handleDelete = (actionableId) => {
    const networkClusterCode = localStorage.getItem("networkClusterCode");
    dispatch(removeActionable({ actionableId: actionableId, networkClusterCode }));
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
    if (!title.trim()) return;

    const tempId = `temp-sub-${Date.now()}`;

    dispatch(
      createSubTask({
        tempId,
        actionableId,
        title,
      })
    );
  };

  const toggleSubtask = (actionableId, subTask) => {
    dispatch(
      updateSubTask({
        _id: subTask._id,
        actionableId,
        isCompleted: !subTask.isCompleted,
        title: subTask.title,
      })
    );
  };

  const onUpdateSubtask = (actionableId, subTaskId, title) => {
    dispatch(
      updateSubTask({
        _id: subTaskId,
        actionableId,
        title,
      })
    );
  };

  // Delete Subtask
  const onDeleteSubtask = (actionableId, subTaskId) => {
    dispatch(
      removeSubTask({
        actionableId,
        subTaskId,
      })
    );
  };

  const onSaveActionable = (actionableId, updates) => {
    dispatch(
      updateActionable({
        actionableId,
        ...updates,
      })
    );
  };




  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);

    return () => clearTimeout(debounceTimerRef.current);
  }, [searchValue]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentSearch = searchParams.get("search") || "";
    if (currentSearch === debouncedSearch) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearch]);

  // For changing page params when redirect to any empty page
  // useEffect(() => {
  //   if (!loading && page > 1 && total > 0 && items.length === 0) {
  //     const params = new URLSearchParams(searchParams.toString());
  //     params.set("page", page - 1);
  //     router.replace(`?${params.toString()}`);
  //   }
  // }, [items, page, loading, total]);


  return (
    <div className="flex-1 flex flex-col  min-h-0 bg-[#F2F7FF] pt-[30px] mt-[20px] rounded-[20px] overflow-hidden">
      {loading && !debouncedSearch ?
        <><ActionableShimmer /></> :
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
            disableWhileAdd={adding}
          />

          <div className="flex flex-1 w-full overflow-y-auto pt-[20px] px-[30px]">
            {activeItem === "today" && (
              <TodayItems
                items={items}
                adding={adding}
                onAdd={handleAdd}
                handleDelete={handleDelete}
                onToggle={toggleItem}
                onCancelAdding={() => setAdding(false)}
              />
            )}

            {activeItem === "past" &&
              (items.length ? (
                <PastItems items={items} onToggle={toggleItem}/>
              ) : (
                <EmptyState searchValue={debouncedSearch}/>
              ))}

            {activeItem === "all" &&
              (items.length ? (
                <AllItems
                  items={items}
                  onToggle={toggleItem}
                  handleDelete={handleDelete}
                />
              ) : (
                <EmptyState searchValue={debouncedSearch}/>
              ))}
          </div>
          {total > 10 && items.length>0 && (
            <div className="flex justify-between gap-2 bg-[#F2F7FF] pt-[20px] px-[30px] pb-[33px] sticky bottom-0 rounded-[0px 20px 20px 0px]">
              <div className="h-[48px] flex items-center text-lg font-semibold text-[#333333]">
                Showing {(page - 1) * CONSTANTS.ITEMS_PER_PAGE + 1} to {Math.min(page * CONSTANTS.ITEMS_PER_PAGE, total)} out of {total} entries
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 flex gap-[80px]">
                <button
                  disabled={page === 1}
                  onClick={() => changePage(page - 1)}
                  className="w-[48px] h-[48px] flex items-center justify-center rounded-full border-[1.2px] text-[24px]
                    border-[#0B57D0] text-[#0B57D0]
                    disabled:border-[#999999] disabled:text-[#999999] cursor-pointer"
                >
                  <IoIosArrowBack />
                </button>

                <button
                  disabled={page === totalPages}
                  onClick={() => changePage(page + 1)}
                  className="w-[48px] h-[48px] flex items-center justify-center rounded-full border-[1.2px] text-[24px]
                    border-[#0B57D0] text-[#0B57D0]
                    disabled:border-[#999999] disabled:text-[#999999] cursor-pointer"
                >
                  <IoIosArrowForward />
                </button>
              </div>
              <div />
            </div>
          )}
        </>
      }

      {modal.type === "DETAILS" && selectedTask && (
        <ActionableDetailsModal
          task={selectedTask}
          onClose={() => dispatch(closeModal())}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onUpdateSubtask={onUpdateSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onSave={onSaveActionable}
        />
      )}
      {modal.type === "MOVE" && selectedTask && (
        <DatepickerModal selectedTask={selectedTask} />
      )}
      {modal.type === "DELETE" && selectedTask && (
        <DeleteConfirm selectedTask={selectedTask} handleDelete={()=>handleDelete(selectedTask?.actionableId)} />
      )}

    </div>
  );
}
