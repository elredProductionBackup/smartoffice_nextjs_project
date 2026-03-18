import React, { useState, useEffect, useRef } from "react";
import ButtonComp from "./ButtonComp";
import AddTask from "./AddTask";
import { useDispatch, useSelector } from "react-redux";
import { openModal, closeModal } from "@/store/actionable/actionableUiSlice";
import ActionableDetailsModal from "./ActionableDetailsModal";


const creators = [
  { id: 1, name: "Rakesh Tyagi", avatar: "https://randomuser.me/api/portraits/men/11.jpg" },
  { id: 2, name: "Jason Statham", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: 3, name: "Hemant", avatar: "https://randomuser.me/api/portraits/men/54.jpg" },
  { id: 4, name: "Rahul Kumar", avatar: "https://randomuser.me/api/portraits/men/76.jpg" },
  { id: 5, name: "Priya Sharma", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: 6, name: "Anita Desai", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
  { id: 7, name: "Arjun Mehta", avatar: "https://randomuser.me/api/portraits/men/85.jpg" },
  { id: 8, name: "Neha Verma", avatar: "https://randomuser.me/api/portraits/women/12.jpg" },
];

const tasks = [
  { id: 1, title: "Book tickets for all members", creatorId: 1, difficulty: "hard" },
  { id: 2, title: "Connect with vendors for discussion", creatorId: 2, difficulty: "medium" },
  { id: 3, title: "Today meeting with channel partner at 5:00 PM", creatorId: 3, difficulty: "easy" },
  { id: 4, title: "Your stay is confirmed at Hotel Gateway Grandeur on 5 Dec 2025.", creatorId: 4, difficulty: "hard" },
  { id: 5, title: "Prepare presentation slides for quarterly review", creatorId: 5, difficulty: "medium" },
  { id: 6, title: "Send follow-up emails to all conference attendees", creatorId: 6, difficulty: "easy" },
  { id: 7, title: "Finalize event venue layout and seating plan", creatorId: 7, difficulty: "hard" },
  { id: 8, title: "Arrange transportation for guest speakers", creatorId: 8, difficulty: "medium" },
  { id: 9, title: "Confirm catering menu and headcount", creatorId: 1, difficulty: "easy" },
  { id: 10, title: "Coordinate with marketing team for promotions", creatorId: 2, difficulty: "hard" },
  { id: 11, title: "Design event invitation creatives", creatorId: 5, difficulty: "medium" },
  { id: 12, title: "Set up registration desk and welcome kits", creatorId: 3, difficulty: "easy" },
  { id: 13, title: "Review sponsorship agreements and contracts", creatorId: 4, difficulty: "hard" },
  { id: 14, title: "Schedule rehearsal with keynote speakers", creatorId: 7, difficulty: "medium" },
  { id: 15, title: "Arrange accommodation for outstation team members", creatorId: 6, difficulty: "easy" },
  { id: 16, title: "Create social media countdown campaign", creatorId: 8, difficulty: "hard" },
  { id: 17, title: "Prepare budget report and expense tracking sheet", creatorId: 2, difficulty: "medium" },
  { id: 18, title: "Conduct final technical equipment check", creatorId: 1, difficulty: "easy" },
];

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

const ChecklistContent = () => {
  const hasChecklistData = true;
  const [taskList, setTaskList] = useState(tasks);
  const [checked, setChecked] = useState({});
  const [openMenu, setOpenMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(new Set(["All"]));
  const [activeDifficulty, setActiveDifficulty] = useState("hard");
  const [showDifficultyBar, setShowDifficultyBar] = useState(false);
  // One ref entry per task id so contains() checks the correct DOM node
  const menuRefs = useRef({});

  const { modal } = useSelector((state) => state.actionableUi);
  const dispatch = useDispatch();

  const selectedTaskForModal = taskList.find(
    (t) => t.id === modal.taskId || t.actionableId === modal.taskId
  );

  // Map local task to the format ActionableDetailsModal expects
  const mappedTask = selectedTaskForModal ? {
    ...selectedTaskForModal,
    actionableId: selectedTaskForModal.id,
    createdBy: creators.find(c => c.id === selectedTaskForModal.creatorId),
    subTask: selectedTaskForModal.subTask || [],
    notes: selectedTaskForModal.notes || "",
    comments: selectedTaskForModal.comments || [],
    isLocal: true
  } : null;

  // Close dropdown when clicking anywhere outside the open menu
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

  const toggleCheck = (id) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleMenu = (id) =>
    setOpenMenu((prev) => (prev === id ? null : id));

  const toggleCategory = (category) =>
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });

  const handleAddTask = ({ label, difficulty }) => {
    const newTask = {
      id: Date.now(),
      title: label,
      difficulty,
      creatorId: 1, // default creator
    };
    setTaskList((prev) => [newTask, ...prev]);
  };

  const updateTaskLocally = (id, updates) => {
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleAddSubtask = (id, title) => {
    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        const newSubTask = { _id: Date.now(), title, isCompleted: false };
        return { ...t, subTask: [newSubTask, ...(t.subTask || [])] };
      }
      return t;
    }));
  };

  const handleToggleSubtask = (id, subTask) => {
    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          subTask: t.subTask.map(st => st._id === subTask._id ? { ...st, isCompleted: !st.isCompleted } : st)
        };
      }
      return t;
    }));
  };

  const handleUpdateSubtask = (id, subTaskId, title) => {
    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          subTask: t.subTask.map(st => st._id === subTaskId ? { ...st, title } : st)
        };
      }
      return t;
    }));
  };

  const handleDeleteSubtask = (id, subTaskId) => {
    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          subTask: (t.subTask || []).filter(st => st._id !== subTaskId)
        };
      }
      return t;
    }));
  };

  const { user } = useSelector((state) => state.auth);

  const handleAddComment = (id, text) => {
    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        const newComment = {
          _id: Date.now().toString(),
          comment: text,
          name: user?.firstname || "Me",
          dpURL: user?.dpURL || "",
          createdAt: new Date().toISOString(),
          email: user?.email
        };
        return { ...t, comments: [...(t.comments || []), newComment] };
      }
      return t;
    }));
  };

  const handleDeleteComment = (id, commentId) => {
    setTaskList(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          comments: (t.comments || []).filter(c => c._id !== commentId)
        };
      }
      return t;
    }));
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

      {hasChecklistData && (
        <div className="w-full">
          <div className=" flex justify-between ">
            <div className=" w-[136px] flex items-center justify-between">
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
              const countFor = (diff) => ({
                total: taskList.filter((t) => t.difficulty === diff).length,
                done:  taskList.filter((t) => t.difficulty === diff && checked[t.id]).length,
              });
              return (
                <div className="flex justify-around items-center gap-3">
                  <div style={{ display: showDifficultyBar && activeDifficulty !== "hard" ? "none" : "block" }}>
                    <CircularProgress
                      {...countFor("hard")}
                      fillColor="#f13c3f"
                      emptyColor="#F2BFC5"
                      onClick={() => { setActiveDifficulty("hard"); setShowDifficultyBar(true); }}
                    />
                  </div>
                  <div style={{ display: showDifficultyBar && activeDifficulty !== "medium" ? "none" : "block" }}>
                    <CircularProgress
                      {...countFor("medium")}
                      fillColor="#ffae3c"
                      emptyColor="#F6E1C5"
                      onClick={() => { setActiveDifficulty("medium"); setShowDifficultyBar(true); }}
                    />
                  </div>
                  <div style={{ display: showDifficultyBar && activeDifficulty !== "easy" ? "none" : "block" }}>
                    <CircularProgress
                      {...countFor("easy")}
                      fillColor="#43ae34"
                      emptyColor="#a0c59cff"
                      onClick={() => { setActiveDifficulty("easy"); setShowDifficultyBar(true); }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
          {/* ================= difficulty selection boxes =======================    */}
            {showDifficultyBar && <div className="w-full h-[50px]  mt-5 gap-1.5 flex">
              <button
                onClick={() => setActiveDifficulty("hard")}
                className={`w-[180px] text-[20px] cursor-pointer h-full rounded-full ${activeDifficulty === "hard" ? "bg-[#d3e3fd] font-bold" : "font-[500]"}`}
              >
                Very difficult
              </button>
              <button
                onClick={() => setActiveDifficulty("medium")}
                className={`w-[180px] text-[20px] cursor-pointer h-full rounded-full ${activeDifficulty === "medium" ? "bg-[#d3e3fd] font-bold" : "font-[500]"}`}
              >
                Mildly difficult
              </button>
              <button
                onClick={() => setActiveDifficulty("easy")}
                className={`w-[180px] text-[20px] cursor-pointer h-full rounded-full ${activeDifficulty === "easy" ? "bg-[#d3e3fd] font-bold" : "font-[500]"}`}
              >
                Easy to do
              </button>
              <button onClick={() => { setActiveDifficulty(null); setShowDifficultyBar(false); }} className="w-[106px] border-[2px] text-[16px] cursor-pointer border-[#666666] text-[#666666] h-full rounded-full flex items-center justify-center gap-2">Close <span><img src="/image/cross.svg" /></span></button>
            </div>}
          <div className="flex flex-col gap-2 mt-5">
            {taskList
              .filter((task) => !activeDifficulty || task.difficulty === activeDifficulty)
              .map((task) => {
              const creator = creators.find((c) => c.id === task.creatorId);
              const isDone = !!checked[task.id];

              return (
                <div
                  key={task.id}
                  className="flex min-h-[80px] items-start gap-3 pb-[20px] pt-[20px] pl-2 border-b border-[#d4dff1]"
                >
                  {/* Checkbox */}
                  <div className="pt-[5px]">
                    <button
                      onClick={() => toggleCheck(task.id)}
                      className="shrink-0 w-[18px] h-[18px] rounded-[3px] border-[2px] border-[#666666] flex items-center justify-center "
                      style={isDone ? { borderColor: "#e72d38", backgroundColor: "#e72d38" } : {}}
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
                    onClick={() => dispatch(openModal({ type: "DETAILS", taskId: task.id }))}
                  >
                    <div
                      className={`text-[20px] font-[500] leading-snug ${isDone ? "line-through text-[#333333]" : "text-[#333333]"
                        }`}
                    >
                      {task.title}
                    </div>
                    {creator && (
                      <div className="text-[16px] text-[#666666] font-[600] mt-0.5">
                        {creator.name}
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
                          <div className="w-[32px] h-[32px] rounded-full bg-[#D3E3FD] border-2 border-white flex items-center justify-center text-[12px] font-bold text-[#0B57D0] shrink-0">
                            +{task.collaborators.length - 3}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* 3-dot menu */}
                  <div ref={(el) => (menuRefs.current[task.id] = el)} className="relative shrink-0 pt-[4px]">
                    <button
                      onClick={() => toggleMenu(task.id)}
                      className="w-6 h-6 flex items-center justify-center hover:opacity-70"
                    >
                      <img
                        src="/image/Three-dots.svg"
                        alt="More options"
                        className="w-[24px] h-[24px] cursor-pointer"
                      />
                    </button>

                    {openMenu === task.id && (
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
                        <button onMouseDown={(e) => e.stopPropagation()} className="w-full flex items-center gap-3 px-4 py-2.5 text-[18px] font-[500] text-gray-800 hover:bg-gray-50">
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
        </div>
      )}

      {modal.type === "DETAILS" && mappedTask && (
        <ActionableDetailsModal
          task={mappedTask}
          onClose={() => dispatch(closeModal())}
          onSave={(id, updates) => updateTaskLocally(id, updates)}
          onAddSubtask={(id, title) => handleAddSubtask(id, title)}
          onToggleSubtask={(id, subTask) => handleToggleSubtask(id, subTask)}
          onUpdateSubtask={(id, subTaskId, title) => handleUpdateSubtask(id, subTaskId, title)}
          onDeleteSubtask={(id, subTaskId) => handleDeleteSubtask(id, subTaskId)}
          onAddComment={(id, text) => handleAddComment(id, text)}
          onDeleteComment={(id, commentId) => handleDeleteComment(id, commentId)}
          hideLinkEvent={true}
          canEdit={true}
        />
      )}

      {/* =============== Event List – empty condition ================  */}
      {!hasChecklistData && (
        <div className="flex flex-col items-center justify-center py-24 w-full">
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

