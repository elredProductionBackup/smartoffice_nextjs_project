import { IoSearch, IoClose } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import { addWeeks, formatWeekRange } from "@/utils/week";
import { useEffect } from "react";
import { useSelector } from "react-redux";


export default function ActionHeader({
  activeItem,
  tabs,
  searchOpen,
  searchValue,
  weekDate,
  setWeekDate,
  onSearchOpen,
  onSearchClose,
  onSearchChange,
  onAdd,
  onTabChange,
  // debounceRef,
  disableWhileAdd
}) {
  const isWeekly = activeItem === "weekly";
  const week = formatWeekRange(weekDate);
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.userType?.toLowerCase() === "admin";

  const canEditOrDelete = isAdmin;
  

  return (
    <div className="flex items-center justify-between mb-[20px] mx-[30px]">
      {/* LEFT */}
      <div className="flex items-center gap-[20px]">
        <h2 className="text-[24px] font-[700] text-[#666]">
          Action Items
        </h2>

        {activeItem === "today" && canEditOrDelete && (
          <button
            onClick={!disableWhileAdd ? onAdd : undefined}
            disabled={disableWhileAdd}
            className={`w-[50px] h-[36px] rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] text-white flex items-center justify-center cursor-pointer       
            ${ disableWhileAdd
                ? "opacity-50 cursor-not-allowed pointer-events-none"
                : "cursor-pointer"
            }`}>
            <FaPlus size={16} />
          </button>
        )}

        {/* WEEK RANGE */}
        {isWeekly && (
          <div className="flex items-center gap-[20px]">

            <span className="font-[700] text-[#111827] text-[24px]">
              {/* {week.label} */}
               {week.month} {week.year}
            </span>

            <button className="w-[40px] flex justify-center cursor-pointer" onClick={() => setWeekDate(addWeeks(weekDate, -1))}>
              <IoChevronBack />
            </button>
            <button className="w-[40px] flex justify-center cursor-pointer" onClick={() => setWeekDate(addWeeks(weekDate, 1))}>
              <IoChevronForward />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-[4px]">
        {/* Search */}
        <div
          className={`flex items-center bg-[#D3E3FD] rounded-[4px] overflow-hidden transition-all duration-300 mr-[6px]
          ${searchOpen ? "w-[300px]" : "w-[40px]"}`}
        >
          <button
            onClick={onSearchOpen}
            className={`min-w-[40px] h-[32px] flex items-center justify-center ${!searchOpen && 'cursor-pointer'}`}
          >
            <IoSearch size={18} />
          </button>

          {searchOpen && (
            <>
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search item"
                className="flex-1 bg-transparent outline-none text-[14px] px-[6px]"
              />
              <button
                onClick={onSearchClose}
                className="w-[32px] h-[32px] flex items-center justify-center cursor-pointer"
              >
                <IoClose size={18} />
              </button>
            </>
          )}
        </div>

        {/* Tabs */}
        {tabs.map((tab) => {
          const key = tab.toLowerCase();
          const isActive = activeItem === key;

          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`h-[32px] px-[16px] rounded-[4px] font-[600] cursor-pointer
              ${isActive ? "bg-[#354C71] text-white" : "bg-[#D3E3FD] text-[#666]"}`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
