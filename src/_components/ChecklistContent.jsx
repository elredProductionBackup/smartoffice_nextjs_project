import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import ButtonComp from "./ButtonComp";
import AddTask from "./AddTask";
import { useDispatch, useSelector } from "react-redux";
import { openModal, closeModal } from "@/store/actionable/actionableUiSlice";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import EventsPopups from "./EventsComps/EventsPopups";
import ActionableDetailsModal from "./ActionableDetailsModal";
import StatusSelect from "./UI/StatusSelect";
import {
  fetchEventChecklist,
  toggleEventActionable,
  setEventActionableStatus,
  createEventActionable,
  updateEventActionable,
  removeEventActionable,
  createEventSubTask,
  updateEventSubTask,
  removeEventSubTask,
  createEventComment,
  removeEventComment,
  fetchMasterConfig,
  saveMasterConfig
} from "@/store/events/eventsThunks";
import { setChecklistMaster } from "@/store/events/eventsSlice";
import { addToast } from "@/store/toastSlice";




// Values are the actionable `status` stored by the backend.
// "pending" is the "Select Status" option, so picking it resets the row and StatusSelect shows its placeholder
const TASK_STATUS_OPTIONS = [
  { value: "pending", label: "Select Status", dotClassName: "border border-slate-300", isPlaceholder: true },
  { value: "InProgress", label: "WIP", dotClassName: "bg-amber-500" },
  { value: "completed", label: "Done", dotClassName: "bg-green-600" },
  { value: "notRequired", label: "Not Required", dotClassName: "bg-slate-400" },
];

// Master checklist status is saved on the master list itself (PATCH /masterList),
// which only accepts these values ("" clears it: the status is left out of the save)
const MASTER_STATUS_OPTIONS = [
  { value: "", label: "Select Status", dotClassName: "border border-slate-300", isPlaceholder: true },
  { value: "WIP", label: "WIP", dotClassName: "bg-amber-500" },
  { value: "Done", label: "Done", dotClassName: "bg-green-600" },
  { value: "Not Required", label: "Not Required", dotClassName: "bg-slate-400" },
];

// Rows saved before the status field existed have no status: treat them as pending,
// or completed if their box is ticked
const getTaskStatus = (task) =>
  task.status || (task.isCompleted === true || task.isCompleted === "true" ? "completed" : "pending");

// Master checklist difficulty -> event task category / colour
const MASTER_DIFFICULTY_CATEGORY = {
  hard: "Very difficult",
  medium: "Mildly difficult",
  easy: "Easy to do",
};
const MASTER_DIFFICULTY_COLOR = {
  hard: "bg-red-500",
  medium: "bg-yellow-400",
  easy: "bg-green-500",
};
const CATEGORY_COLOR = {
  "Very difficult": "bg-red-500",
  "Mildly difficult": "bg-yellow-400",
  "Easy to do": "bg-green-500",
};

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
  const {
    eventChecklist: taskList,
    eventChecklistLoading: loading,
    selectedEvent,
    checklistMaster: masterList,
    masterLoading,
  } = useSelector((state) => state.events);
  const { modal } = useSelector((state) => state.actionableUi);
  const { user } = useSelector((state) => state.auth);

  const [deleteTask, setDeleteTask] = useState(null); // { id, title } awaiting confirmation
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState(null);
  const [showDifficultyBar, setShowDifficultyBar] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch tasks for this event ONLY
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventChecklist({ eventId }));
    }
  }, [dispatch, eventId]);

  // Master checklist items are shown on every event
  useEffect(() => {
    dispatch(fetchMasterConfig());
  }, [dispatch]);

  // Search matches master item labels, and event task titles or their subtask titles
  const query = search.trim().toLowerCase();
  const matchesSearch = (text) => !query || (text || "").toLowerCase().includes(query);

  const visibleMasterList = masterList.filter(
    (item) =>
      (!activeDifficulty || MASTER_DIFFICULTY_CATEGORY[item.difficulty] === activeDifficulty) &&
      matchesSearch(item.label)
  );
  const visibleTaskList = taskList.filter(
    (task) =>
      (!activeDifficulty || task.category === activeDifficulty) &&
      (matchesSearch(task.title) || task.subTask?.some((st) => matchesSearch(st.title)))
  );
  const noSearchResults =
    !!query && (masterList.length > 0 || taskList.length > 0) &&
    visibleMasterList.length === 0 && visibleTaskList.length === 0;

  const selectedTaskForModal = taskList.find(
    (t) => t.id === modal.taskId || t.actionableId === modal.taskId
  );

  const mappedTask = selectedTaskForModal ? {
    ...selectedTaskForModal,
    isLocal: false
  } : null;

  const showError = (title, descrip) =>
    dispatch(addToast({ message: { title, descrip }, type: "error" }));

  const toggleCheck = async (task) => {
    const taskId = task.actionableId || task.id;
    const newCompleted = !(task.isCompleted === true || task.isCompleted === "true");
    const result = await dispatch(toggleEventActionable({ actionableId: taskId, isCompleted: newCompleted }));
    if (toggleEventActionable.rejected.match(result)) {
      showError("Couldn't update task", result.payload || "Please try again.");
    }
  };

  const changeTaskStatus = async (task, status) => {
    const prevStatus = getTaskStatus(task);
    if (status === prevStatus) return;

    const result = await dispatch(
      setEventActionableStatus({
        actionableId: task.actionableId || task.id,
        status,
        prevStatus,
        prevIsCompleted: task.isCompleted,
      })
    );
    if (setEventActionableStatus.rejected.match(result)) {
      showError("Couldn't update status", result.payload || "Please try again.");
    }
  };

  // The whole master list is saved together: apply the new status, save, roll back on failure
  const changeMasterStatus = async (item, status) => {
    if (status === (item.status || "")) return;

    const previous = masterList;
    dispatch(
      setChecklistMaster(
        masterList.map((m) => (m === item ? { ...m, status } : m))
      )
    );

    const result = await dispatch(saveMasterConfig());
    if (!saveMasterConfig.fulfilled.match(result)) {
      dispatch(setChecklistMaster(previous));
      showError("Couldn't update status", result.payload || "Please try again.");
    }
  };

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

  const handleDeleteTask = () => {
    if (!deleteTask) return;
    const networkClusterCode = localStorage.getItem("networkClusterCode");
    dispatch(removeEventActionable({ actionableId: deleteTask.id, networkClusterCode }));
    setDeleteTask(null);
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
            {/* =============== Search ================ */}
            <div className="relative w-[300px] max-w-full">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search checklist"
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-[#E2E8F0] text-[15px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition"
              />
            </div>
          </div>

          {/* ===========task completion Progress bar=================== */}
          {(() => {
            // Counts both the event's own tasks and the master checklist items for a category
            const countFor = (p) => {
              const filteredTasks = taskList.filter((t) => t.category === p);
              const filteredMaster = masterList.filter(
                (item) => MASTER_DIFFICULTY_CATEGORY[item.difficulty] === p
              );
              return {
                total: filteredTasks.length + filteredMaster.length,
                done:
                  filteredTasks.filter(
                    (t) => t.isCompleted === true || t.isCompleted === "true" || t.status === "completed"
                  ).length + filteredMaster.filter((item) => item.status === "Done").length,
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

        {/* =============== Master Checklist ================ */}
        <div className="flex items-center gap-4 mt-8">
          <span className="text-[20px] font-[600] text-[#333333] whitespace-nowrap pl-2">
            Master Checklist
          </span>
          <div className="flex-1 h-[1px] bg-[#B3C6E7]" />
          <button
            onClick={() => dispatch(openEventsModal({ type: "MASTER_CHECKLIST" }))}
            className="py-[6px] px-[16px] rounded-[100px] border border-[#BCBCD9] bg-white text-[16px] font-[500] cursor-pointer flex items-center gap-[4px] whitespace-nowrap"
          >
            + Add / Edit
          </button>
        </div>
        {masterLoading && !masterList.length && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {visibleMasterList.length > 0 && (
          <div className="flex flex-col gap-2 mt-5">
            {visibleMasterList.map((item, idx) => {
              const masterKey = `master-${item._id || idx}`;
              return (
                <div
                  key={masterKey}
                  className="flex min-h-[80px] items-center gap-3 pb-[20px] pt-[20px] pl-2 border-b border-[#d4dff1] last:border-b-0"
                >
                  {/* Same columns as event rows so everything lines up */}
                  <span className="shrink-0 w-[18px]" />

                  <div className="flex-1 min-w-0 text-[20px] font-[500] leading-snug text-[#333333] break-words">
                    {item.label}
                  </div>

                  <span
                    className={`h-[12px] w-[50px] shrink-0 rounded-full ${MASTER_DIFFICULTY_COLOR[item.difficulty]}`}
                  />

                  {/* Status */}
                  <StatusSelect
                    value={item.status}
                    onChange={(value) => changeMasterStatus(item, value)}
                    options={MASTER_STATUS_OPTIONS}
                  />

                  <span className="shrink-0 w-[200px]" />
                  <span className="shrink-0 w-9" />
                </div>
              );
            })}
          </div>
        )}

        {/* =============== Event Specific Checklist ================ */}
        {(masterList.length > 0 || taskList.length > 0) && (
          <div className="flex items-center gap-4 mt-8">
            <span className="text-[20px] font-[600] text-[#333333] whitespace-nowrap pl-2">
              Event Specific Checklist
            </span>
            <div className="flex-1 h-[1px] bg-[#B3C6E7]" />
          </div>
        )}

        {/* =============== Task List ================ */}
        {visibleTaskList.length > 0 && (
          <div className="flex flex-col gap-2 mt-5">
            {visibleTaskList
              .map((task, idx) => {
                const creatorName = task.createdBy?.name || (task.createdBy?.firstname ? `${task.createdBy.firstname} ${task.createdBy.lastname || ""}` : "Me");
                const isDone = task.isCompleted === true || task.isCompleted === "true";
                const taskId = task.actionableId || task.id || `task-${idx}`;

                return (
                  <div
                    key={taskId}
                    className="flex min-h-[80px] items-start gap-3 pb-[20px] pt-[20px] pl-2 border-b border-[#d4dff1] last:border-b-0"
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

                    {/* Difficulty */}
                    <div className="h-9 flex items-center shrink-0">
                      <span
                        className={`h-[12px] w-[50px] rounded-full ${CATEGORY_COLOR[task.category] || "bg-transparent"}`}
                      />
                    </div>

                    {/* Status */}
                    <StatusSelect
                      value={getTaskStatus(task)}
                      onChange={(value) => changeTaskStatus(task, value)}
                      options={TASK_STATUS_OPTIONS}
                    />

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

                    {/* Delete */}
                    <button
                      type="button"
                      title="Delete task"
                      onClick={() => setDeleteTask({ id: taskId, title: task.title })}
                      className="shrink-0 h-9 w-9 rounded-md grid place-items-center text-[#71717A] hover:text-[#E40000] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
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

      {/* Master checklist popup + its add/edit form */}
      <EventsPopups />

      {/* =============== Delete confirmation ================  */}
      {deleteTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDeleteTask(null)}
        >
          <div
            className="w-[480px] rounded-[28px] bg-white pt-[70px] pb-[40px] shadow-xl flex flex-col items-center gap-[45px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[24px] font-[700] px-[60px] text-center break-words">
              Are you sure you want to delete &quot;{deleteTask.title}&quot;?
            </div>
            <div className="flex gap-[80px]">
              <button
                onClick={() => setDeleteTask(null)}
                className="rounded-full text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="rounded-full text-[20px] bg-gradient-to-r from-[#5597ED] to-[#00449C] w-[120px] px-[16px] py-[8px] text-white cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== Search – no matches ================  */}
      {noSearchResults && (
        <div className="text-center text-gray-500 text-[16px] py-8">
          No checklist items match &quot;{search.trim()}&quot;
        </div>
      )}

      {/* =============== Event List – empty condition ================  */}
      {taskList.length === 0 && masterList.length > 0 && !loading && !query && (
        <div className="text-center text-gray-500 text-[16px] py-8">
          No event specific items yet
        </div>
      )}

      {taskList.length === 0 && masterList.length === 0 && !loading && !masterLoading && (
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

