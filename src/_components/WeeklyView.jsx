"use client";

import { getStartOfWeek, addWeeks } from "@/utils/week";

export default function WeeklyView({ weekDate, tasks = [] }) {
  const startOfWeek = getStartOfWeek(weekDate);

  // Generate Mon → Sun
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Generate 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const today = new Date();

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  return (
    <div className="flex h-full rounded-[12px] bg-[#F5F9FF]">
      {/* TIME COLUMN */}
      <div className="w-[80px] flex-shrink-0  bg-[#F8FAFF]">
        <div className="h-[60px]" />
        {hours.map((hour) => (
          <div
            key={hour}
            className="h-[60px] text-[12px] text-right pr-[10px] text-[#666] border-r border-[#DCDCDC] last:border-r-0"
          >
            {hour === 0
              ? "12:00 AM"
              : hour < 12
              ? `${hour}:00 AM`
              : hour === 12
              ? "12:00 PM"
              : `${hour - 12}:00 PM`}
          </div>
        ))}
      </div>

      {/* WEEK GRID */}
      <div className="flex flex-1 min-w-[900px]">
        {days.map((date) => {
          const isToday = isSameDay(date, today);

          return (
            <div key={date.toISOString()} className="flex-1">
              {/* DAY HEADER */}
              <div
                className={`h-[60px] text-center ${
                  isToday ? "bg-[#0B5ED7] text-white" : "bg-[#DDE9FF]"
                }`}
              >
                <div className="text-[12px] font-[600] pt-[6px]">
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                  }).toUpperCase()}
                </div>
                <div className="text-[18px] font-[700]">
                  {date.getDate()}
                </div>
              </div>

              {/* TIME CELLS */}
              {hours.map((hour) => (
                <div key={hour} className="relative h-[60px] border-r border-[#DCDCDC] last:border-r-0">
                  {tasks
                    .filter(
                      (task) =>
                        task.hour === hour &&
                        isSameDay(new Date(task.date), date)
                    )
                    .map((task) => (
                      <div
                        key={task.id}
                        className="absolute top-[6px] left-[6px] right-[6px]
                        bg-white border rounded-[6px] px-[6px] py-[4px] shadow-sm"
                      >
                        <div className="flex gap-[6px] items-start">
                          <input type="checkbox" />
                          <div className="text-[12px] leading-[16px] line-clamp-2">
                            {task.text}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ADD TASK FLOATING BUTTON */}
      <button
        className="fixed bottom-[40px] right-[40px] bg-[#2F80ED]
        text-white px-[18px] py-[10px] rounded-full shadow-lg"
      >
        + Add task
      </button>
    </div>
  );
}
