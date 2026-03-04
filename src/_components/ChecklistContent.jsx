import React, { useState, useEffect, useRef } from "react";
import ButtonComp from "./ButtonComp";
import AddTask from "./AddTask";


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
              const stats = ["hard", "medium", "easy"].reduce((acc, diff) => {
                const total = taskList.filter((t) => t.difficulty === diff).length;
                const done  = taskList.filter((t) => t.difficulty === diff && checked[t.id]).length;
                acc[diff] = { total, done };
                return acc;
              }, {});
              return (
                <div className="w-[220px] h-[50px] flex justify-around items-center">
                  <div
                    onClick={() => { setActiveDifficulty("hard"); setShowDifficultyBar(true); }}
                    className="red-progress h-[50px] w-[50px] rounded-full border-[5px] border-[#f13c3f] cursor-pointer flex flex-row items-center justify-center leading-none"
                  >
                    <span className="text-[15px] font-bold text-[#333333]">{stats.hard.done}</span>
                    <span className="text-[15px] text-[#333333] font-bold">/{stats.hard.total}</span>
                  </div>
                  <div
                    onClick={() => { setActiveDifficulty("medium"); setShowDifficultyBar(true); }}
                    className="orange-progress h-[50px] w-[50px] rounded-full border-[5px] border-[#ffae3c] cursor-pointer flex flex-row items-center justify-center leading-none"
                  >
                    <span className="text-[15px] font-bold text-[#333333]">{stats.medium.done}</span>
                    <span className="text-[15px] text-[#333333] font-bold">/{stats.medium.total}</span>
                  </div>
                  <div
                    onClick={() => { setActiveDifficulty("easy"); setShowDifficultyBar(true); }}
                    className="green-progress h-[50px] w-[50px] rounded-full border-[5px] border-[#43ae34] cursor-pointer flex flex-row items-center justify-center leading-none"
                  >
                    <span className="text-[15px] font-bold text-[#333333]">{stats.easy.done}</span>
                    <span className="text-[15px] text-[#333333] font-bold">/{stats.easy.total}</span>
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
                  className="flex h-[80px] items-center gap-3 pb-[20px] pl-2 border-b border-[#d4dff1]"
                >
                  {/* Checkbox */}
                  <div className="h-full pt-[6px]">
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
                  <div className="flex-1 min-w-0">
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
                  </div>

                  {/* Avatar */}
                  {creator && (
                    <div className="h-[32px] w-[200px]"> <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-[32px] h-[32px] rounded-full object-fit shrink-0"
                    /> </div>
                  )}

                  {/* 3-dot menu */}
                  <div ref={(el) => (menuRefs.current[task.id] = el)} className="relative shrink-0">
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

