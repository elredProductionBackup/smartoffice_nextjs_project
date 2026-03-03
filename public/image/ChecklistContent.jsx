import React, { useState, useEffect, useRef } from "react";
import ButtonComp from "./ButtonComp";

// ─── Dummy Data ────────────────────────────────────────────────────────────────
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
  { id: 1, title: "Book tickets for all members", creatorId: 1 },
  { id: 2, title: "Connect with vendors for discussion", creatorId: 2 },
  { id: 3, title: "Today meeting with channel partner at 5:00 PM", creatorId: 3 },
  { id: 4, title: "Your stay is confirmed at Hotel Gateway Grandeur on 5 Dec 2025.", creatorId: 4 },
  { id: 5, title: "Prepare presentation slides for quarterly review", creatorId: 5 },
  { id: 6, title: "Send follow-up emails to all conference attendees", creatorId: 6 },
  { id: 7, title: "Finalize event venue layout and seating plan", creatorId: 7 },
  { id: 8, title: "Arrange transportation for guest speakers", creatorId: 8 },
  { id: 9, title: "Confirm catering menu and headcount", creatorId: 1 },
  { id: 10, title: "Coordinate with marketing team for promotions", creatorId: 2 },
  { id: 11, title: "Design event invitation creatives", creatorId: 5 },
  { id: 12, title: "Set up registration desk and welcome kits", creatorId: 3 },
  { id: 13, title: "Review sponsorship agreements and contracts", creatorId: 4 },
  { id: 14, title: "Schedule rehearsal with keynote speakers", creatorId: 7 },
  { id: 15, title: "Arrange accommodation for outstation team members", creatorId: 6 },
  { id: 16, title: "Create social media countdown campaign", creatorId: 8 },
  { id: 17, title: "Prepare budget report and expense tracking sheet", creatorId: 2 },
  { id: 18, title: "Conduct final technical equipment check", creatorId: 1 },
];

// ─── Component ─────────────────────────────────────────────────────────────────

const ChecklistContent = () => {
  const hasChecklistData = true; 
  const [checked, setChecked] = useState({});
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(new Set(["All"]));
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

  return (
    <div>
      {/* =============== Event List – non empty condition ================  */}
      {hasChecklistData && (
        <div className="w-full">
          <div className="text-[24px] font-[600] mb-4 pl-2">All</div>

          <div className="flex flex-col gap-2">
            {tasks.map((task) => {
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
                      className={`text-[20px] font-[500] leading-snug ${
                        isDone ? "line-through text-[#333333]" : "text-[#333333]"
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
                        className="absolute right-0 top-8 z-5 bg-white rounded-[20px] gap-[10px] shadow-2xl p-[20px] w-[334px] "
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

                        {/* Divider */}
                        <div className="border-t w-[200px] ml-[20px] border-gray-200 my-1" onMouseDown={(e) => e.stopPropagation()} />

                        {/* Category list */}
                        {[
                          "All",
                          "Hotel reservations",
                          "Flights",
                          "Ground logistics",
                          "F&B",
                          "Special request",
                          "Membership",
                          "Resource/speaker coordination",
                          "Board coordination",
                          "Spouse coordination",
                        ].map((category) => {
                          const isSelected = selectedCategories.has(category);
                          return (
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              key={category}
                              onClick={() => toggleCategory(category)}
                              className="w-[300px] flex items-center my-[5px] px-[12px] py-[8px] text-[18px] font-[500] text-[#333333] hover:bg-gray-50"
                            >
                              {isSelected ? (
                                <span className="text-gray-700 text-[16px] pr-[9px]">
                                  <img src="/image/tick-content.svg" alt="check" />
                                </span>
                              ) : (
                                <span className="w-[16px] h-[16px] mr-[9px]" />
                              )}
                              {category}
                            </button>
                          );
                        })}
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
