"use client";

import { useDatepicker } from "@/store/useDatePicker";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function DatepickerModal() {
  const {
    isOpen,
    selectedDate,
    hoveredDate,
    setDate,
    setHoveredDate,
    closeDatepicker,
    onConfirm,
  } = useDatepicker();

  if (!isOpen) return null;

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const changeMonth = (offset) => {
    setDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-[28px] bg-white p-[30px] shadow-xl ">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">Move</h2>
          <button onClick={closeDatepicker} className="text-gray-400 text-3xl cursor-pointer">
            ×
          </button>
        </div>

        {/* Calendar Container */}
        <div className="rounded-2xl border border-gray-200 py-6 px-9">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {new Date(year, month).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h3>

            <div className="flex gap-8 text-gray-500 text-3xl mr-3">
              <button onClick={() => changeMonth(-1)} className="cursor-pointer">
                <IoIosArrowBack size={25}/>
              </button>
              <button onClick={() => changeMonth(1)} className="cursor-pointer">
                <IoIosArrowForward size={25}/>
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 text-center text-[16px] font-semibold text-gray-500 mb-4">
            {DAYS.map((d, idx) => (
              <div key={idx}>{d}</div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {/* Previous month */}
            {[...Array(firstDay)].map((_, i) => (
              <div
                key={i}
                className="text-gray-300 text-base flex items-center justify-center"
              >
                {prevMonthDays - firstDay + i + 1}
              </div>
            ))}

            {/* Current month */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDate.getDate() === day;
              const isHovered = hoveredDate === day;

              return (
                <button
                  key={day}
                  onMouseEnter={() => setHoveredDate(day)}
                  onMouseLeave={() => setHoveredDate(null)}
                  onClick={() => setDate(new Date(year, month, day))}
                  className={`
                    mx-auto flex h-11 w-11 items-center justify-center
                    rounded-lg text-base font-medium
                    ${
                      isSelected
                        ? "bg-blue-700 text-white"
                        : isHovered
                        ? "bg-blue-100 text-gray-900"
                        : "text-gray-900"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={closeDatepicker}
            className="h-[43px] w-[120px] rounded-full bg-[#999999] text-[20px] font-medium text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onConfirm?.(selectedDate);
              closeDatepicker();
            }}
            className="h-[43px] w-[120px] rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-[20px] font-medium text-white cursor-pointer"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
