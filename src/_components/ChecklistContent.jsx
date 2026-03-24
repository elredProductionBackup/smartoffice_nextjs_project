import React, { useState, useEffect, useRef } from "react";
import ButtonComp from "./ButtonComp";
import AddTask from "./AddTask";
import { useDispatch, useSelector } from "react-redux";
import { openModal, closeModal } from "@/store/actionable/actionableUiSlice";
import ActionableDetailsModal from "./ActionableDetailsModal";
import {
  fetchEventChecklist,
  toggleEventActionable,
  createEventActionable,
  updateEventActionable,
  removeEventActionable,
  createEventSubTask,
  updateEventSubTask,
  removeEventSubTask,
  createEventComment,
  removeEventComment
} from "@/store/events/eventsThunks";




// ─── Circular Progress Ring ────────────────────────────────────────────────────
const CircularProgress = ({ done, total, fillColor, emptyColor, onClick }) => {
  const size = 55;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;       // 27.5
  const circumference = 2 * Math.PI * radius;    // ≈ 172.8
  const pct = total === 0 ? 0 : done / total;
  const offset = circumference * (1 - pct);
  return (
    <div
      onClick={onClick}
      className="cursor-pointer relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        {/* background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={emptyColor}
          strokeWidth={strokeWidth}
        />
        {/* progress arc with rounded ends */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {/* centre label */}
      <div
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: "700", color: "#333333", lineHeight: 1, whiteSpace: "nowrap" }}>
          {done}/{total}
        </span>
      </div>
    </div>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────

const ChecklistContent = ({ eventId }) => {
  const dispatch = useDispatch();
  const { eventChecklist: taskList, eventChecklistLoading: loading, selectedEvent } = useSelector((state) => state.events);
  const { modal } = useSelector((state) => state.actionableUi);
  const { user } = useSelector((state) => state.auth);

  const [openMenu, setOpenMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState(null);
  const [showDifficultyBar, setShowDifficultyBar] = useState(false);
  const menuRefs = useRef({});

  // Fetch tasks for this event ONLY
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventChecklist({ eventId }));
    }
  }, [dispatch, eventId]);

  useEffect(() => {
    if (!eventId) return;
    const intervalId = setInterval(() => {
      dispatch(fetchEventChecklist({ eventId }));
    }, 15000);
    return () => clearInterval(intervalId);
  }, [dispatch, eventId]);

  const selectedTaskForModal = taskList.find(
    (t) => t.id === modal.taskId || t.actionableId === modal.taskId
  );

  const mappedTask = selectedTaskForModal ? {
    ...selectedTaskForModal,
    isLocal: false
  } : null;

  useEffect(() => {
    if (!openMenu) return;
    const handleOutsideClick = (e) => {
      const node = menuRefs.current[openMenu];
      if (node && !node.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openMenu]);

  const toggleCheck = (task) => {
    const taskId = task.actionableId || task.id;
    const newCompleted = !(task.isCompleted === true || task.isCompleted === "true");
    dispatch(toggleEventActionable({ actionableId: taskId, isCompleted: newCompleted }));
  };

  const toggleMenu = (id) =>
    setOpenMenu((prev) => (prev === id ? null : id));

  const handleAddTask = ({ label, difficulty }) => {
    const categoryValue =
      difficulty === "hard"
        ? "Very difficult"
        : difficulty === "medium"
        ? "Mildly difficult"
        : "Easy to do";

    dispatch(
      createEventActionable({
        tempId: `temp-${Date.now()}`,
        title: label,
        isCompleted: false,
        category: categoryValue,
        notes: "",
        linkedEvent: [
          {
            eventId: eventId,
            name: "",
            url: "",
          },
        ],
        dueDateTimeStamp: "",
        collaborators: [],
      })
    );
    setShowAddModal(false);
  };

  const handleDeleteTask = (actionableId) => {
    const networkClusterCode = localStorage.getItem("networkClusterCode");
    dispatch(removeEventActionable({ actionableId, networkClusterCode }));
    setOpenMenu(null);
  };

  return (
    <div>
      {/* =============== Event List – non empty condition ================  */}
      {/* Add Task Modal */}
      {showAddModal && (
        <AddTask
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
        />
      )}

      {/* =============== Header – Always visible ================  */}
      <div className="w-full">
        <div className=" flex justify-between ">
          <div className=" w-fit flex items-center gap-4">
            <span className="text-[24px] font-[600] pl-2">All</span>
            {/* =============== Add Task Button ================ */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-[50px] h-[36px] rounded-full flex items-center justify-center cursor-pointer"
              style={{ backgroundImage: "linear-gradient(90deg, #5597ED 0%, #00449C 100%)" }}
            >
              <img src="/image/Plus-Icon.svg" alt="plus" />
            </button>
          </div>

          {/* ===========task completion Progress bar=================== */}
          {(() => {
            const countFor = (p) => {
              const filteredTasks = taskList.filter((t) => t.category === p);
              return {
                total: filteredTasks.length,
                done: filteredTasks.filter(
                  (t) => t.isCompleted === true || t.isCompleted === "true"
                ).length,
              };
            };
            return (
              <div className="flex justify-around items-center gap-3">
                <div style={{ display: showDifficultyBar && activeDifficulty !== "Very difficult" ? "none" : "block" }}>
                  <CircularProgress
                    {...countFor("Very difficult")}
                    fillColor="#f13c3f"
                    emptyColor="#F2BFC5"
                    onClick={() => { setActiveDifficulty("Very difficult"); setShowDifficultyBar(true); }}
                  />
                </div>
                <div style={{ display: showDifficultyBar && activeDifficulty !== "Mildly difficult" ? "none" : "block" }}>
                  <CircularProgress
                    {...countFor("Mildly difficult")}
                    fillColor="#ffae3c"
                    emptyColor="#F6E1C5"
                    onClick={() => { setActiveDifficulty("Mildly difficult"); setShowDifficultyBar(true); }}
                  />
                </div>
                <div style={{ display: showDifficultyBar && activeDifficulty !== "Easy to do" ? "none" : "block" }}>
                  <CircularProgress
                    {...countFor("Easy to do")}
                    fillColor="#43ae34"
                    emptyColor="#a0c59cff"
                    onClick={() => { setActiveDifficulty("Easy to do"); setShowDifficultyBar(true); }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* ================= difficulty selection boxes =======================    */}
        {showDifficultyBar && <div className="w-full h-[50px]  mt-5 gap-1.5 flex">
          <button
            onClick={() => setActiveDifficulty("Very difficult")}
            className={`w-[180px] text-[20px] cursor-pointer h-full rounded-full ${activeDifficulty === "Very difficult" ? "bg-[#FFEBEB] text-[#E40000] font-bold" : "font-[500]"}`}
          >
            Very difficult
          </button>
          <button
            onClick={() => setActiveDifficulty("Mildly difficult")}
            className={`w-[180px] text-[20px] cursor-pointer h-full rounded-full ${activeDifficulty === "Mildly difficult" ? "bg-[#FFEBEB] text-[#E40000] font-bold" : "font-[500]"}`}
          >
            Mildly difficult
          </button>
          <button
            onClick={() => setActiveDifficulty("Easy to do")}
            className={`w-[180px] text-[20px] cursor-pointer h-full rounded-full ${activeDifficulty === "Easy to do" ? "bg-[#FFEBEB] text-[#E40000] font-bold" : "font-[500]"}`}
          >
            Easy to do
          </button>
          <button onClick={() => { setActiveDifficulty(null); setShowDifficultyBar(false); }} className="w-[106px] border-[2px] text-[16px] cursor-pointer border-[#666666] text-[#666666] h-full rounded-full flex items-center justify-center gap-2">Close <span><img src="/image/cross.svg" /></span></button>
        </div>}

        {/* =============== Task List ================ */}
        {taskList.length > 0 && (
          <div className="flex flex-col gap-2 mt-5">
            {taskList
              .filter((task) => !activeDifficulty || task.category === activeDifficulty)
              .map((task, idx) => {
                const creatorName = task.createdBy?.name || (task.createdBy?.firstname ? `${task.createdBy.firstname} ${task.createdBy.lastname || ""}` : "Me");
                const isDone = task.isCompleted === true || task.isCompleted === "true";
                const taskId = task.actionableId || task.id || `task-${idx}`;

                return (
                  <div
                    key={taskId}
                    className="flex min-h-[80px] items-start gap-3 pb-[20px] pt-[20px] pl-2 border-b border-[#d4dff1]"
                  >
                    {/* Checkbox */}
                    <div className="pt-[5px]">
                      <button
                        onClick={() => toggleCheck(task)}
                        className="shrink-0 w-[18px] h-[18px] rounded-[3px] border-[2px] border-[#666666] flex items-center justify-center "
                        style={isDone ? { borderColor: "#E40000", backgroundColor: "#E40000" } : {}}
                      >
                        {isDone && (
                          <img
                            src="/image/TickVector.svg"
                            alt="checked"
                            className="w-[11px] h-[11px]"
                          />
                        )}
                      </button>
                    </div>

                    {/* Task info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => dispatch(openModal({ type: "DETAILS", taskId: taskId }))}
                    >
                      <div
                        className={`text-[20px] font-[500] leading-snug ${isDone ? "line-through text-[#333333]" : "text-[#333333]"
                          }`}
                      >
                        {task.title}
                      </div>
                      {creatorName && (
                        <div className="text-[16px] text-[#666666] font-[600] mt-0.5">
                          {creatorName}
                        </div>
                      )}
                      {/* Subtasks display */}
                      {task.subTask && task.subTask.length > 0 && (
                        <div className="mt-2 ml-4 flex flex-col gap-1">
                          {task.subTask.map((st) => (
                            <div key={st._id} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#333333] shrink-0" />
                              <span className={`text-[16px] font-[400] text-[#333333] ${st.isCompleted ? 'line-through opacity-60' : ''}`}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Avatar Stack */}
                    <div className="h-[32px] w-[200px] pt-[2px] flex items-center -space-x-3">
                      {task.collaborators && task.collaborators.length > 0 && (
                        <>
                          {task.collaborators.slice(0, 3).map((col, idx) => (
                            <img
                              key={idx}
                              src={col.dp || col.dpURL || ""}
                              alt={col.name || "collaborator"}
                              className="w-[32px] h-[32px] rounded-full object-cover shrink-0 bg-gray-200 border-2 border-white"
                            />
                          ))}
                          {task.collaborators.length > 3 && (
                            <div className="w-[32px] h-[32px] rounded-full bg-[#FFEBEB] border-2 border-white flex items-center justify-center text-[12px] font-bold text-[#E40000] shrink-0">
                              +{task.collaborators.length - 3}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* 3-dot menu */}
                    <div ref={(el) => (menuRefs.current[taskId] = el)} className="relative shrink-0 pt-[4px]">
                      <button
                        onClick={() => toggleMenu(taskId)}
                        className="w-6 h-6 flex items-center justify-center hover:opacity-70"
                      >
                        <img
                          src="/image/Three-dots.svg"
                          alt="More options"
                          className="w-[24px] h-[24px] cursor-pointer"
                        />
                      </button>

                      {openMenu === taskId && (
                        <div
                          className="absolute right-0 top-8 z-5 bg-white rounded-[20px] gap-[10px] shadow-2xl p-[20px] w-[300px] "
                          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {/* Move item */}
                          <button onMouseDown={(e) => e.stopPropagation()} className="w-full flex items-center gap-3 px-4 py-2.5 text-[18px] font-[500] text-gray-800 hover:bg-gray-50">
                            <img
                              src="/image/Group.svg"
                              alt="Move"
                              className="w-[18px] h-[18px]"
                            />
                            Move item
                          </button>

                          {/* Delete item */}
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => handleDeleteTask(taskId)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[18px] font-[500] text-red-600 hover:bg-red-50"
                          >
                            <img
                              src="/image/Delete-content.svg"
                              alt="Delete"
                              className="w-[18px] h-[18px]"
                            />
                            Delete item
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {modal.type === "DETAILS" && mappedTask && (
        <ActionableDetailsModal
          task={mappedTask}
          onClose={() => dispatch(closeModal())}
          onSave={(id, updates) => dispatch(updateEventActionable({ actionableId: id, ...updates }))}
          onAddSubtask={(id, title) => dispatch(createEventSubTask({ actionableId: id, title, tempId: `temp-${Date.now()}` }))}
          onToggleSubtask={(id, subTask) => dispatch(updateEventSubTask({ actionableId: id, ...subTask, isCompleted: !subTask.isCompleted }))}
          onUpdateSubtask={(id, subTaskId, title) => dispatch(updateEventSubTask({ actionableId: id, _id: subTaskId, title }))}
          onDeleteSubtask={(id, subTaskId) => dispatch(removeEventSubTask({ actionableId: id, subTaskId }))}
          onAddComment={(id, text) => dispatch(createEventComment({ actionableId: id, comment: text, tempId: `temp-${Date.now()}` }))}
          onDeleteComment={(id, commentId) => dispatch(removeEventComment({ actionableId: id, commentId }))}
          hideLinkEvent={true}
          canEdit={true}
        />
      )}

      {/* =============== Event List – empty condition ================  */}
      {taskList.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24 w-full mt-10">
          <img
            src="/image/Events_checklist.svg"
            alt="No Checklist Info"
            className="w-[80px] h-[80px] mb-6 object-contain"
          />
          <div className="text-[24px] font-semibold mb-2">No information yet</div>
          <div className="text-gray-500 text-[16px] font-normal">
            Looks like no information about Checklist yet
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistContent;

